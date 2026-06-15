import Constants from 'expo-constants';
import { getDatabase } from '../db';
import { DeviceRegistry } from '../db/models/DeviceRegistry';
import { OperationalAnomaly } from '../db/models/OperationalAnomaly';

const getDeviceFingerprint = (): string => {
  const deviceInfo = [
    Constants.deviceName || 'unknown',
    Constants.platform?.android?.deviceId || 'unknown',
    Constants.platform?.ios?.deviceId || 'unknown',
    Constants.deviceYearClass?.toString() || 'unknown',
    Constants.installationId || 'unknown',
  ].join('|');

  let hash = 0;
  for (let i = 0; i < deviceInfo.length; i++) {
    const char = deviceInfo.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

const logUnauthorizedDeviceAnomaly = async (fingerprint: string, storeId?: string) => {
  try {
    const db = getDatabase();
    await db.write(async () => {
      await db.get<OperationalAnomaly>('operational_anomalies').create((anomaly) => {
        anomaly.anomalyType = 'UNAUTHORIZED_DEVICE_ATTEMPT';
        anomaly.severity = 'critical';
        anomaly.storeId = storeId;
        anomaly.payload = JSON.stringify({ fingerprint, timestamp: new Date().toISOString() });
        anomaly.createdAt = new Date();
      });
    });
  } catch (error) {
    console.error('Failed to log unauthorized device anomaly:', error);
  }
};

export const checkDeviceAuthorization = async (storeId?: string, isSoloOwner?: boolean): Promise<boolean> => {
  // For solo owners, skip strict device checks
  if (isSoloOwner) {
    return true;
  }

  try {
    const db = getDatabase();
    const fingerprint = getDeviceFingerprint();

    const devices = await db.get<DeviceRegistry>('device_registry').query().fetch();

    let matchingDevice;
    
    if (storeId) {
      // Check for device registered specifically for this store
      matchingDevice = devices.find(d => 
        d.deviceFingerprint === fingerprint && 
        d.storeId === storeId && 
        d.isTrusted
      );
    } else {
      // Fallback to non-store-specific check
      matchingDevice = devices.find(d => 
        d.deviceFingerprint === fingerprint && 
        d.isTrusted
      );
    }

    if (!matchingDevice) {
      await logUnauthorizedDeviceAnomaly(fingerprint, storeId);
      return false;
    }

    await db.write(async () => {
      if (matchingDevice) {
        matchingDevice.lastLogin = new Date();
        await matchingDevice.update();
      }
    });

    return true;
  } catch (error) {
    console.error('Device authorization check failed:', error);
    // If WatermelonDB isn't ready, default to allowing (for solo owner or first-run)
    return true;
  }
};

export const registerDevice = async (
  storeId?: string,
  fingerprint?: string
): Promise<void> => {
  try {
    const fp = fingerprint || getDeviceFingerprint();
    const db = getDatabase();

    await db.write(async () => {
      const newDevice = await db.get<DeviceRegistry>('device_registry').create(device => {
        device.deviceFingerprint = fp;
        device.storeId = storeId;
        device.isTrusted = true;
        device.lastLogin = new Date();
      });
    });
  } catch (error) {
    console.error('Failed to register device:', error);
    // Ignore errors for now (first run, native modules not ready, etc.)
  }
};

export const getCurrentFingerprint = getDeviceFingerprint;