import { useQuery } from '@nozbe/watermelondb/react';
import { database } from './index';
import { OperationalAnomaly } from './models/OperationalAnomaly';
import { SalesEvent } from './models/SalesEvent';

export const useAnomalies = () => {
  const anomaliesQuery = database
    .get<OperationalAnomaly>('operational_anomalies')
    .query();
  
  return useQuery(anomaliesQuery);
};

export const useSalesEvents = () => {
  const salesQuery = database
    .get<SalesEvent>('sales_events')
    .query();
  
  return useQuery(salesQuery);
};
