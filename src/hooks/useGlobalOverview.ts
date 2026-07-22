import { useState, useEffect } from 'react';
import { database } from '../db';
import { useAuth } from '../context/AuthContext';

export interface GlobalOverview {
  total_revenue_today: number;
  active_shifts_count: number;
  unresolved_anomalies_count: number;
  locked_shifts_count: number;
}

export function useGlobalOverview() {
  const { authorizedStores } = useAuth();
  const [overview, setOverview] = useState<GlobalOverview>({
    total_revenue_today: 0,
    active_shifts_count: 0,
    unresolved_anomalies_count: 0,
    locked_shifts_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all data
        const [salesEvents, shifts, anomalies] = await Promise.all([
          database.get('sales_events').query().fetch(),
          database.get('shifts').query().fetch(),
          database.get('operational_anomalies').query().fetch()
        ]);

        // Calculate total revenue
        const todaysSales = salesEvents.filter(
          (e: any) => new Date(e.createdAt) >= today && new Date(e.createdAt) < tomorrow
        );
        const totalRevenue = todaysSales.reduce(
          (sum: number, s: any) => sum + (s.priceAtSale * s.quantity),
          0
        );

        // Calculate active shifts count
        const activeShiftsCount = shifts.filter(
          (s: any) => s.status === 'open'
        ).length;

        // Calculate unresolved anomalies count
        const unresolvedAnomaliesCount = anomalies.filter(
          (a: any) => !a.resolved
        ).length;

        // Calculate locked shifts count
        const lockedShiftsCount = shifts.filter(
          (s: any) => s.status === 'discrepancy_locked'
        ).length;

        setOverview({
          total_revenue_today: totalRevenue,
          active_shifts_count: activeShiftsCount,
          unresolved_anomalies_count: unresolvedAnomaliesCount,
          locked_shifts_count: lockedShiftsCount
        });
      } catch (error) {
        console.error('Error fetching global overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [authorizedStores]);

  return { overview, loading };
}
