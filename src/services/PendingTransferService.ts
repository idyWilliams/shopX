import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../db';
import { PendingTransfer } from '../db/models/PendingTransfer';
import { syncData } from '../lib/sync';

/**
 * Creates a new pending transfer
 */
export const createPendingTransfer = async (
  storeId: string,
  ticketId: string | null,
  saleId: string | null,
  amount: number,
  currency: string = 'NGN'
): Promise<PendingTransfer> => {
  const database = getDatabase();
  return await database.write(async () => {
    const transfer = await database.get<PendingTransfer>('pending_transfers').create(t => {
      t.storeId = storeId;
      t.ticketId = ticketId;
      t.saleId = saleId;
      t.amount = amount;
      t.currency = currency;
      t.status = 'initiated';
    });

    // Try to sync
    try {
      await syncData();
    } catch (err) {
      console.warn('Sync failed after creating pending transfer:', err);
    }

    return transfer;
  });
};

/**
 * Marks a pending transfer as confirmed
 */
export const confirmTransfer = async (transferId: string): Promise<PendingTransfer> => {
  const database = getDatabase();
  return await database.write(async () => {
    const transfer = await database.get<PendingTransfer>('pending_transfers').find(transferId);
    const updatedTransfer = await transfer.update(t => {
      t.status = 'confirmed';
      t.confirmedAt = new Date();
    });

    // Try to sync
    try {
      await syncData();
    } catch (err) {
      console.warn('Sync failed after confirming transfer:', err);
    }

    return updatedTransfer;
  });
};

/**
 * Marks a pending transfer as failed
 */
export const failTransfer = async (transferId: string): Promise<PendingTransfer> => {
  const database = getDatabase();
  return await database.write(async () => {
    const transfer = await database.get<PendingTransfer>('pending_transfers').find(transferId);
    const updatedTransfer = await transfer.update(t => {
      t.status = 'failed';
    });

    // Try to sync
    try {
      await syncData();
    } catch (err) {
      console.warn('Sync failed after failing transfer:', err);
    }

    return updatedTransfer;
  });
};

/**
 * Gets all pending (initiated) transfers for a store
 */
export const getPendingTransfers = async (storeId: string): Promise<PendingTransfer[]> => {
  const database = getDatabase();
  return await database.get<PendingTransfer>('pending_transfers')
    .query(Q.where('store_id', storeId), Q.where('status', 'initiated'))
    .fetch();
};
