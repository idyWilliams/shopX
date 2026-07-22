import { useState, useEffect } from 'react';
import { getDatabase } from '../db';
import { useAuth } from '../context/AuthContext';
import { SalesEvent } from '../db/models/SalesEvent';
import { Shift } from '../db/models/Shift';
import { OperationalAnomaly } from '../db/models/OperationalAnomaly';

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
  const { authorizedStores } = useAuth();
  const [summaries, setSummaries] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const database = getDatabase();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all sales events today
        const salesEvents = await database.get<SalesEvent>('sales_events').query().fetch();
        const todaysSales = salesEvents.filter(
          (e) => new Date(e.createdAt) >= today && new Date(e.createdAt) < tomorrow
        );

        // Fetch all shifts today
        const shifts = await database.get<Shift>('shifts').query().fetch();
        const todaysShifts = shifts.filter(
          (s) => new Date(s.openedAt) >= today && new Date(s.openedAt) < tomorrow
        );

        // Fetch all anomalies
        const anomalies = await database.get<OperationalAnomaly>('operational_anomalies').query().fetch();

        // Create summaries for each store
        const storeSummaries: StoreSummary[] = authorizedStores.map(store => {
          const storeSales = todaysSales.filter((s) => s.storeId === store.id);
          const revenueToday = storeSales.reduce(
            (sum: number, s) => sum + (s.priceAtSale * s.quantity),
            0
          );

          const activeShift = todaysShifts.find(
            (s) => s.storeId === store.id && s.status === 'open'
          );

          const storeAnomalies = anomalies.filter(
            (a) => a.storeId === store.id && !a.resolved
          );

          const lastActivity = [...storeSales, ...todaysShifts].sort(
            (a, b) => {
              const aDate = 'createdAt' in a ? a.createdAt : a.openedAt;
              const bDate = 'createdAt' in b ? b.createdAt : b.openedAt;
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            }
          )[0];

          return {
            store_id: store.id,
            name: store.name,
            location: store.locationAddress || store.location_address,
            revenue_today: revenueToday,
            active_shift: activeShift,
            active_attendant_name: activeShift?.attendantId ? 'Attendant' : undefined,
            anomaly_count: storeAnomalies.length,
            last_activity_at: lastActivity
              ? new Date('createdAt' in lastActivity ? lastActivity.createdAt : lastActivity.openedAt)
              : new Date()
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
