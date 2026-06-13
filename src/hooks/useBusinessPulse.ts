import { useState, useEffect, useCallback } from 'react';
import {
  supabaseMock,
  mockStaleStockAlerts,
  mockFootTrafficEvents,
} from '../services/supabaseMock';
import type { StaleStockAlert, FootTrafficEvent, ActivityFeed, Inventory } from '../types';

interface BusinessPulseState {
  staleStockAlerts: StaleStockAlert[];
  trafficAnomalies: FootTrafficEvent[];
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface BusinessPulseActions {
  refresh: () => void;
  dismissAlert: (alertId: string) => void;
}

const STALE_THRESHOLD_DAYS = 30;

export function useBusinessPulse(): BusinessPulseState & BusinessPulseActions {
  const [state, setState] = useState<BusinessPulseState>({
    staleStockAlerts: mockStaleStockAlerts,
    trafficAnomalies: mockFootTrafficEvents,
    isLoading: false,
    lastUpdated: new Date(),
  });

  const analyzeStaleStock = useCallback((): StaleStockAlert[] => {
    const inventory = supabaseMock.getInventory();
    const products = supabaseMock.getProducts();
    const locations = supabaseMock.getLocations();
    const activities = supabaseMock.getActivityFeed();

    const alerts: StaleStockAlert[] = [];
    const now = new Date();

    for (const inv of inventory) {
      const lastActivity = activities.find(
        (a) =>
          a.product_id === inv.product_id &&
          a.source_location_id === inv.location_id &&
          a.type === 'sale'
      );

      if (lastActivity) {
        const lastSaleDate = new Date(lastActivity.timestamp);
        const daysSinceLastSale = Math.floor(
          (now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastSale > STALE_THRESHOLD_DAYS) {
          const product = products.find((p) => p.id === inv.product_id);
          const location = locations.find((l) => l.id === inv.location_id);

          if (product && location) {
            alerts.push({
              id: `stale-${inv.id}`,
              product_id: inv.product_id,
              location_id: inv.location_id,
              quantity: inv.quantity,
              days_inactive: daysSinceLastSale,
              product_name: product.name,
              location_name: location.name,
            });
          }
        }
      }
    }

    return alerts.sort((a, b) => b.days_inactive - a.days_inactive);
  }, []);

  const analyzeTrafficAnomalies = useCallback((): FootTrafficEvent[] => {
    const trafficEvents = supabaseMock.getFootTrafficEvents();
    const activities = supabaseMock.getActivityFeed();

    return trafficEvents.filter((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      const salesDuringEvent = activities.filter((a) => {
        if (a.type !== 'sale') return false;
        const saleTime = new Date(a.timestamp);
        return saleTime >= eventStart && saleTime <= eventEnd;
      });

      return event.motion_count > 20 && salesDuringEvent.length === 0;
    });
  }, []);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }));

    setTimeout(() => {
      const staleAlerts = analyzeStaleStock();
      const trafficAnomalies = analyzeTrafficAnomalies();

      setState({
        staleStockAlerts: staleAlerts,
        trafficAnomalies: trafficAnomalies,
        isLoading: false,
        lastUpdated: new Date(),
      });
    }, 500);
  }, [analyzeStaleStock, analyzeTrafficAnomalies]);

  const dismissAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      staleStockAlerts: prev.staleStockAlerts.filter((a) => a.id !== alertId),
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [refresh]);

  return {
    ...state,
    refresh,
    dismissAlert,
  };
}
