import { useState, useEffect } from 'react';
import { getDatabase } from './index';
import { OperationalAnomaly } from './models/OperationalAnomaly';
import { SalesEvent } from './models/SalesEvent';
import { Lead } from './models/Lead';

export const useAnomalies = () => {
  const [anomalies, setAnomalies] = useState<OperationalAnomaly[]>([]);
  
  useEffect(() => {
    const db = getDatabase();
    const subscription = db
      .get<OperationalAnomaly>('operational_anomalies')
      .query()
      .observe()
      .subscribe(setAnomalies);
    
    return () => subscription.unsubscribe();
  }, []);
  
  return anomalies;
};

export const useSalesEvents = () => {
  const [salesEvents, setSalesEvents] = useState<SalesEvent[]>([]);
  
  useEffect(() => {
    const db = getDatabase();
    const subscription = db
      .get<SalesEvent>('sales_events')
      .query()
      .observe()
      .subscribe(setSalesEvents);
    
    return () => subscription.unsubscribe();
  }, []);
  
  return salesEvents;
};

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  
  useEffect(() => {
    const db = getDatabase();
    const subscription = db
      .get<Lead>('leads')
      .query()
      .observe()
      .subscribe(setLeads);
    
    return () => subscription.unsubscribe();
  }, []);
  
  return leads;
};
