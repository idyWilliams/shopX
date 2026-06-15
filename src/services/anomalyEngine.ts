import { getDatabase } from '../db';
import { SalesEvent } from '../db/models/SalesEvent';
import { OperationalAnomaly } from '../db/models/OperationalAnomaly';
import { CashDrawerLog } from '../db/models/CashDrawerLog';

const CASH_DISCREPANCY_THRESHOLD = 5000;
const MAX_VOIDS_PER_HOUR = 3;

export interface DailyAnomalyReport {
  date: Date;
  anomalies: OperationalAnomaly[];
  cashDiscrepancies: number[];
  excessiveVoids: boolean;
  criticalSecurityAlerts: OperationalAnomaly[];
  totalSales: number;
  shopHealth: 'balanced' | 'unbalanced';
}

export const getDailyAnomalyReport = async (
  date: Date = new Date()
): Promise<DailyAnomalyReport> => {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  const db = getDatabase();

  // Get all operational anomalies for today
  const allAnomalies = await db
    .get<OperationalAnomaly>('operational_anomalies')
    .query()
    .fetch();

  // Get all sales events for today
  const allSalesEvents = await db
    .get<SalesEvent>('sales_events')
    .query()
    .fetch();

  // Get all cash drawer logs for today
  const cashDrawerLogs = await db
    .get<CashDrawerLog>('cash_drawer_logs')
    .query()
    .fetch();

  // Filter records to today's date
  const todaysAnomalies = allAnomalies.filter((anomaly) => {
    const anomalyDate = anomaly.createdAt;
    return anomalyDate >= startOfDay && anomalyDate <= endOfDay;
  });

  const todaysSalesEvents = allSalesEvents.filter((event) => {
    const eventDate = event.createdAt;
    return eventDate >= startOfDay && eventDate <= endOfDay;
  });

  const todaysCashLogs = cashDrawerLogs.filter((log) => {
    const logDate = log.createdAt;
    return logDate >= startOfDay && logDate <= endOfDay;
  });

  // 1. Check for excessive VOID events
  const voidEvents = todaysSalesEvents.filter(
    (e) => e.eventType === 'VOID'
  );
  
  let excessiveVoids = false;
  if (voidEvents.length > 0) {
    const hourBuckets: { [key: number]: number } = {};
    voidEvents.forEach((event) => {
      const hour = event.createdAt.getHours();
      hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
    });
    excessiveVoids = Object.values(hourBuckets).some(
      (count) => count > MAX_VOIDS_PER_HOUR
    );
  }

  // 2. Check cash drawer discrepancies
  const cashDiscrepancies = todaysCashLogs
    .map((log) => log.discrepancy || 0)
    .filter((d) => Math.abs(d) > CASH_DISCREPANCY_THRESHOLD);

  // 3. Check for critical security alerts
  const criticalSecurityAlerts = todaysAnomalies.filter(
    (a) => a.severity === 'critical'
  );

  // 4. Calculate total sales
  const totalSales = todaysSalesEvents.reduce((sum, event) => {
    if (event.eventType === 'SALE') {
      return sum + (event.priceAtSale * event.quantity);
    }
    return sum;
  }, 0);

  // 5. Determine shop health
  const shopHealth =
    cashDiscrepancies.length === 0 && !excessiveVoids && criticalSecurityAlerts.length === 0
      ? 'balanced'
      : 'unbalanced';

  return {
    date: new Date(),
    anomalies: todaysAnomalies,
    cashDiscrepancies,
    excessiveVoids,
    criticalSecurityAlerts,
    totalSales,
    shopHealth,
  };
};
