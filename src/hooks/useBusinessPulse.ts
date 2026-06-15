import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../db';
import { Product } from '../db/models/Product';
import { SalesEvent } from '../db/models/SalesEvent';
import type { StaleStockAlert, FootTrafficEvent } from '../types';

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
    staleStockAlerts: [],
    trafficAnomalies: [],
    isLoading: false,
    lastUpdated: new Date(),
  });

  const analyzeStaleStock = useCallback(async (): Promise<StaleStockAlert[]> => {
    const alerts: StaleStockAlert[] = [];
    const now = new Date();

    try {
      const db = getDatabase();
      const products = await db.get<Product>('products').query().fetch();
      const salesEvents = await db.get<SalesEvent>('sales_events').query().fetch();

      for (const product of products) {
        const productSales = salesEvents.filter(
          (event) => event.productId === product.id && event.eventType === 'SALE'
        );

        if (productSales.length > 0) {
          const lastSale = productSales.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )[0];
          const daysSinceLastSale = Math.floor(
            (now.getTime() - lastSale.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastSale > STALE_THRESHOLD_DAYS) {
            alerts.push({
              id: `stale-${product.id}`,
              product_id: product.id,
              location_id: product.storeId || '',
              quantity: product.stockQuantity,
              days_inactive: daysSinceLastSale,
              product_name: product.name,
              location_name: product.storeId || 'Unknown',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing stale stock:', error);
    }

    return alerts.sort((a, b) => b.days_inactive - a.days_inactive);
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const staleAlerts = await analyzeStaleStock();

      setState({
        staleStockAlerts: staleAlerts,
        trafficAnomalies: [],
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error refreshing business pulse:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [analyzeStaleStock]);

  const dismissAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      staleStockAlerts: prev.staleStockAlerts.filter((a) => a.id !== alertId),
    }));
  }, []);

  useEffect(() => {
    refresh();

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
