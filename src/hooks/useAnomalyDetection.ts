import { useEffect, useRef } from 'react';
import { useAnomalies, useSalesEvents } from '../db/hooks';
import { getDatabase } from '../db';
import { SalesEvent } from '../db/models/SalesEvent';
import { CashDrawerLog } from '../db/models/CashDrawerLog';
import { generateShopReport } from '../lib/whatsappReporter';

const MAX_VOIDS_PER_SHIFT = 3;

export const useAnomalyDetection = () => {
  const anomalies = useAnomalies();
  const salesEvents = useSalesEvents();
  const lastReportTriggered = useRef<Date | null>(null);

  useEffect(() => {
    const detectAnomalies = async () => {
      // Get current shift's start time (e.g., start of today)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // 1. Check for excessive VOID events
      const todaysVoids = salesEvents.filter(
        (event: SalesEvent) =>
          event.eventType === 'VOID' &&
          event.createdAt >= startOfDay
      );

      if (todaysVoids.length > MAX_VOIDS_PER_SHIFT) {
        const now = new Date();
        const timeSinceLastReport = lastReportTriggered.current
          ? now.getTime() - lastReportTriggered.current.getTime()
          : Infinity;

        // Prevent spamming reports - only trigger once every 15 minutes
        if (timeSinceLastReport > 15 * 60 * 1000) {
          lastReportTriggered.current = now;
          await generateShopReport('ANOMALY', {
            anomalies: todaysVoids.length,
            timestamp: now,
          });
        }
      }

      const db = getDatabase();
      // 2. Check cash drawer discrepancies
      const todaysCashLogs = await db
        .get<CashDrawerLog>('cash_drawer_logs')
        .query()
        .fetch();

      const todaysDiscrepancies = todaysCashLogs.filter(
        (log) => log.createdAt >= startOfDay && log.discrepancy
      );

      if (todaysDiscrepancies.length > 0) {
        const now = new Date();
        const timeSinceLastReport = lastReportTriggered.current
          ? now.getTime() - lastReportTriggered.current.getTime()
          : Infinity;

        if (timeSinceLastReport > 15 * 60 * 1000) {
          lastReportTriggered.current = now;
          await generateShopReport('ANOMALY', {
            anomalies: todaysDiscrepancies.length,
            timestamp: now,
          });
        }
      }
    };

    detectAnomalies();
  }, [salesEvents, anomalies]);

  return null;
};
