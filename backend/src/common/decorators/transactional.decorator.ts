import { DataSource } from 'typeorm';

/**
 * Decorator để wrap method trong database transaction
 * Tự động rollback nếu có lỗi, commit nếu thành công
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

    descriptor.value = async function (...args: any[]) {
      // Lấy DataSource từ instance (giả sử service có inject DataSource)
      const dataSource: DataSource = (this as any).dataSource;

      if (!dataSource) {
        throw new Error(
          `@Transactional decorator requires DataSource to be injected in ${target.constructor.name}`,
        );
      }

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Inject queryRunner vào context để các repository có thể dùng
        const originalDataSource = (this as any).dataSource;
        (this as any).queryRunner = queryRunner;

        const result = await originalMethod.apply(this, args);

        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
        // Cleanup
        delete (this as any).queryRunner;
      }
    };

    return descriptor;
  };
}
