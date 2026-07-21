import { database } from '../db';
import { Shift } from '../db/models/Shift';
import { CashDrawerLog } from '../db/models/CashDrawerLog';
import { syncData } from '../lib/sync';

/**
 * Opens a new shift
 */
export const openShift = async (
  storeId: string,
  attendantId: string | null,
  openingCashFloat: number
): Promise<Shift> => {
  const now = new Date();

  return await database.write(async () => {
    // Create shift record
    const shift = await database.get<Shift>('shifts').create(shift => {
      shift.storeId = storeId;
      shift.attendantId = attendantId;
      shift.openedAt = now;
      shift.openingCashFloat = openingCashFloat;
      shift.status = 'open';
    });

    // Create cash drawer opening log
    await database.get<CashDrawerLog>('cash_drawer_logs').create(log => {
      log.storeId = storeId;
      log.shiftId = shift.id;
      log.eventType = 'OPENING';
      log.expectedAmount = openingCashFloat;
      log.actualAmount = openingCashFloat;
      log.discrepancy = 0;
    });

    // Try to sync
    try {
      await syncData();
    } catch (err) {
      console.warn('Sync failed after opening shift:', err);
    }

    return shift;
  });
};

/**
 * Closes an open shift
 */
export const closeShift = async (
  shiftId: string,
  storeId: string,
  declaredCash: number,
  declaredTransfers: number,
  expectedCash: number,
  expectedTransfers: number
): Promise<Shift> => {
  const now = new Date();
  const totalExpected = expectedCash + expectedTransfers;
  const totalDeclared = declaredCash + declaredTransfers;
  const discrepancy = totalDeclared - totalExpected;

  return await database.write(async () => {
    // Get the shift to update
    const shift = await database.get<Shift>('shifts').find(shiftId);
    
    // Update shift record
    const updatedShift = await shift.update(s => {
      s.closedAt = now;
      s.status = discrepancy === 0 ? 'clean' : 'discrepancy_locked';
    });

    // Create cash drawer closing log
    await database.get<CashDrawerLog>('cash_drawer_logs').create(log => {
      log.storeId = storeId;
      log.shiftId = shiftId;
      log.eventType = 'CLOSING';
      log.expectedAmount = totalExpected;
      log.actualAmount = totalDeclared;
      log.discrepancy = discrepancy;
    });

    // Try to sync
    try {
      await syncData();
    } catch (err) {
      console.warn('Sync failed after closing shift:', err);
    }

    return updatedShift;
  });
};

/**
 * Gets the currently active (open) shift for a store
 */
export const getActiveShift = async (storeId: string): Promise<Shift | null> => {
  const shifts = await database.get<Shift>('shifts')
    .query()
    .filter(shift => shift.storeId === storeId && shift.status === 'open')
    .fetch();
  return shifts.length > 0 ? shifts[0] : null;
};
