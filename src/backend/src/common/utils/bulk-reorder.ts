import { ObjectLiteral, Repository } from 'typeorm';

const SAFE_OFFSET = 1_000_000;

export interface ReorderItem {
  id: string;
  orderIndex: number;
}

/**
 * Atomically reassign `order_index` for a set of rows in a 2-pass transaction.
 *
 * Pass 1 shifts every row into a temporary range above SAFE_OFFSET so no two
 * row-level UPDATEs collide on the unique index. Pass 2 writes the final
 * indexes. Required because TypeORM's `@Index({ unique: true })` creates a
 * non-deferrable unique index — without the shift, swapping two rows trips
 * the constraint on the first UPDATE.
 */
export async function bulkReorder<T extends ObjectLiteral>(
  repository: Repository<T>,
  items: ReorderItem[],
): Promise<void> {
  if (items.length === 0) return;
  await repository.manager.transaction(async (manager) => {
    const target = repository.target;
    for (let i = 0; i < items.length; i++) {
      await manager.update(target, items[i].id, {
        orderIndex: SAFE_OFFSET + i,
      } as never);
    }
    for (const item of items) {
      await manager.update(target, item.id, {
        orderIndex: item.orderIndex,
      } as never);
    }
  });
}
