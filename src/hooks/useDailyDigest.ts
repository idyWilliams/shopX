import { useState, useEffect } from 'react';
import { database } from '../db';
import { SalesEvent } from '../db/models/SalesEvent';
import { Shift } from '../db/models/Shift';
import { useAuth } from '../context/AuthContext';

export interface DailyDigest {
  storeId: string;
  date: string;
  totalSalesAmount: number;
  numberOfTransactions: number;
  shifts: {
    total: number;
    clean: number;
    discrepancyLocked: number;
  };
  totalDiscrepancyAmount: number;
  anomalies: any[];
}

export function useDailyDigest() {
  const { activeStoreId } = useAuth();
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateDigest = async () => {
    if (!activeStoreId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's sales events
      const allSales = await database.get<SalesEvent>('sales_events').query().fetch();
      const todaysSales = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return sale.storeId === activeStoreId && saleDate >= today && saleDate < tomorrow;
      });

      const totalSalesAmount = todaysSales.reduce((sum, sale) => {
        return sum + (sale.priceAtSale * sale.quantity);
      }, 0);

      // Get today's shifts
      const allShifts = await database.get<Shift>('shifts').query().fetch();
      const todaysShifts = allShifts.filter(shift => {
        const shiftDate = new Date(shift.openedAt);
        return shift.storeId === activeStoreId && shiftDate >= today && shiftDate < tomorrow;
      });

      const cleanShifts = todaysShifts.filter(s => s.status === 'clean').length;
      const discrepancyShifts = todaysShifts.filter(s => s.status === 'discrepancy_locked').length;

      // TODO: Calculate actual discrepancy amounts from cash drawer logs
      const totalDiscrepancyAmount = 0;

      const newDigest: DailyDigest = {
        storeId: activeStoreId,
        date: today.toISOString().split('T')[0],
        totalSalesAmount,
        numberOfTransactions: todaysSales.length,
        shifts: {
          total: todaysShifts.length,
          clean: cleanShifts,
          discrepancyLocked: discrepancyShifts
        },
        totalDiscrepancyAmount,
        anomalies: []
      };

      setDigest(newDigest);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate digest'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeStoreId) {
      generateDigest();
    }
  }, [activeStoreId]);

  return {
    digest,
    isLoading,
    error,
    refetch: generateDigest
  };
}
