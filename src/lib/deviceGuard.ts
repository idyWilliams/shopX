import Constants from 'expo-constants';
import { database } from '../db';
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

const logUnauthorizedDeviceAnomaly = async (fingerprint: string) => {
  await database.write(async () => {
    await database.get<OperationalAnomaly>('operational_anomalies').create((anomaly) => {
      anomaly.anomalyType = 'UNAUTHORIZED_DEVICE_ATTEMPT';
      anomaly.severity = 'critical';
      anomaly.payload = JSON.stringify({ fingerprint, timestamp: new Date().toISOString() });
      anomaly.createdAt = new Date();
    });
  });
};

export const checkDeviceAuthorization = async (): Promise<boolean> => {
  const fingerprint = getDeviceFingerprint();

  const devices = await database.get<DeviceRegistry>('device_registry').query().fetch();

  const matchingDevice = devices.find(d => d.deviceFingerprint === fingerprint);

  if (!matchingDevice || !matchingDevice.isTrusted) {
    await logUnauthorizedDeviceAnomaly(fingerprint);
    return false;
  }

  await database.write(async () => {
    if (matchingDevice) {
      matchingDevice.lastLogin = new Date();
      await matchingDevice.update();
    }
  });

  return true;
};

export const registerDevice = async (
  fingerprint?: string): Promise<void> => {
    const fp = fingerprint || getDeviceFingerprint();

    await database.write(async () => {
      const newDevice = await database.get<DeviceRegistry>('device_registry').create(device => {
        device.deviceFingerprint = fp;
        device.isTrusted = true;
        device.lastLogin = new Date();
      });
    });
  };

export const getCurrentFingerprint = getDeviceFingerprint;