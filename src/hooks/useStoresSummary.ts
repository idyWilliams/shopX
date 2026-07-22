import { useState, useEffect } from 'react';
import { database } from '../db';
import { useAuth } from '../context/AuthContext';

export interface StoreSummary {
  store_id: string;
  name: string;
  location?: string;
  revenue_today: number;
  active_shift?: any;
  active_attendant_name?: string;
  anomaly_count: number;
  last_activity_at: Date;
}

export function useStoresSummary() {
  const { authorizedStores, activeStoreId } = useAuth();
  const [summaries, setSummaries] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all sales events today
        const salesEvents = await database.get('sales_events').query().fetch();
        const todaysSales = salesEvents.filter(
          (e: any) => new Date(e.createdAt) >= today && new Date(e.createdAt) < tomorrow
        );

        // Fetch all shifts today
        const shifts = await database.get('shifts').query().fetch();
        const todaysShifts = shifts.filter(
          (s: any) => new Date(s.openedAt) >= today && new Date(s.openedAt) < tomorrow
        );

        // Fetch all anomalies
        const anomalies = await database.get('operational_anomalies').query().fetch();

        // Create summaries for each store
        const storeSummaries: StoreSummary[] = authorizedStores.map(store => {
          const storeSales = todaysSales.filter((s: any) => s.storeId === store.id);
          const revenueToday = storeSales.reduce(
            (sum: number, s: any) => sum + (s.priceAtSale * s.quantity),
            0
          );

          const activeShift = todaysShifts.find(
            (s: any) => s.storeId === store.id && s.status === 'open'
          );

          const storeAnomalies = anomalies.filter(
            (a: any) => a.storeId === store.id && !a.resolved
          );

          const lastActivity = [...storeSales, ...todaysShifts].sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          return {
            store_id: store.id,
            name: store.name,
            location: store.location_address,
            revenue_today: revenueToday,
            active_shift: activeShift,
            active_attendant_name: activeShift?.attendantId ? 'Attendant' : undefined,
            anomaly_count: storeAnomalies.length,
            last_activity_at: lastActivity ? new Date(lastActivity.createdAt) : new Date()
          };
        });

        setSummaries(storeSummaries);
      } catch (error) {
        console.error('Error fetching store summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [authorizedStores]);

  return { summaries, loading };
}
