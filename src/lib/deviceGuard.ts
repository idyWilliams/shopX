import Constants from 'expo-constants';

const getDeviceFingerprint = (): string => {
  const deviceInfo = [
    Constants.deviceName || 'unknown',
    Constants.platform?.android?.deviceId || 'unknown',
    Constants.platform?.ios?.deviceId || 'unknown',
    Constants.deviceYearClass?.toString() || 'unknown',
    Constants.installationId || 'unknown',
  ].join('|');

  let hash =0;
  for (let i=0; i<deviceInfo.length; i++) {
    const char = deviceInfo.charCodeAt(i);
    hash = (hash <<5) - hash + char;
    hash |=0;
  }
  return Math.abs(hash).toString(16).padStart(8,'0');
};

import { supabase } from './supabase';

export const checkDeviceAuthorization = async (storeId?: string, isSoloOwner?: boolean): Promise<boolean> => {
  if (isSoloOwner) return true;
  
  const fingerprint = getDeviceFingerprint();
  
  try {
    const { data, error } = await supabase
      .from('device_registry')
      .select('is_trusted')
      .eq('device_fingerprint', fingerprint)
      .single();
      
    if (error || !data) return false;
    
    // Update last login
    await supabase
      .from('device_registry')
      .update({ last_login: new Date().toISOString() })
      .eq('device_fingerprint', fingerprint);
      
    return data.is_trusted;
  } catch (err) {
    console.error('Device authorization check failed:', err);
    return false;
  }
};

export const registerDevice = async (storeId?: string, fingerprint?: string): Promise<void> => {
  const fp = fingerprint || getDeviceFingerprint();
  
  const { error } = await supabase
    .from('device_registry')
    .upsert({ 
      device_fingerprint: fp, 
      store_id: storeId,
      is_trusted: false, // Default to false pending admin approval
      last_login: new Date().toISOString()
    }, { onConflict: 'device_fingerprint' });
    
  if (error) {
    console.error('Error registering device:', error);
    throw error;
  }
};

export const getCurrentFingerprint = getDeviceFingerprint;
