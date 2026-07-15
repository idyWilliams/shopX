/**
 * WatermelonDB reactive hooks.
 * These replace the previously missing `../db/hooks` import.
 */
import { useEffect, useState } from 'react';
import { database } from './index';
import { SalesEvent } from './models/SalesEvent';
import { OperationalAnomaly } from './models/OperationalAnomaly';
import { Lead } from './models/Lead';
import { Q } from '@nozbe/watermelondb';

export function useSalesEvents(): SalesEvent[] {
  const [events, setEvents] = useState<SalesEvent[]>([]);

  useEffect(() => {
    const subscription = database
      .get<SalesEvent>('sales_events')
      .query()
      .observe()
      .subscribe(setEvents);
    return () => subscription.unsubscribe();
  }, []);

  return events;
}

export function useAnomalies(): OperationalAnomaly[] {
  const [anomalies, setAnomalies] = useState<OperationalAnomaly[]>([]);

  useEffect(() => {
    const subscription = database
      .get<OperationalAnomaly>('operational_anomalies')
      .query()
      .observe()
      .subscribe(setAnomalies);
    return () => subscription.unsubscribe();
  }, []);

  return anomalies;
}

export function useLeads(): Lead[] | undefined {
  const [leads, setLeads] = useState<Lead[] | undefined>(undefined);

  useEffect(() => {
    const subscription = database
      .get<Lead>('leads')
      .query()
      .observe()
      .subscribe(data => setLeads(data));
    return () => subscription.unsubscribe();
  }, []);

  return leads;
}
