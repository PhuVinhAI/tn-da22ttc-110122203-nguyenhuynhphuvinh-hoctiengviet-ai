import { DataSource, QueryRunner } from 'typeorm';

/**
 * Interface cho service sử dụng @Transactional() decorator.
 * Service phải implement interface này để có thể truy cập queryRunner một cách type-safe.
 */
export interface TransactionalHost {
  dataSource: DataSource;
  queryRunner?: QueryRunner;
}

/**
 * Decorator để wrap method trong database transaction
 * Tự động rollback nếu có lỗi, commit nếu thành công
 *
 * Service sử dụng decorator này phải inject DataSource và implement TransactionalHost.
 * Truy cập queryRunner qua `this.queryRunner` (đã được typed).
 *
 * Usage:
 * @Transactional()
 * async myMethod() { ... }
 */
export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      this: TransactionalHost,
      ...args: any[]
    ) {
      const dataSource = this.dataSource;

      if (!dataSource) {
        throw new Error(
          `@Transactional decorator requires DataSource to be injected in ${target.constructor.name}`,
        );
      }

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        this.queryRunner = queryRunner;

        const result = await originalMethod.apply(this, args);

        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        this.queryRunner = undefined;
        await queryRunner.release();
      }
    };

    return descriptor;
  };
}
