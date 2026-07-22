import { database } from '../db';

interface CashGapPayload {
  expectedAmount: number;
  declaredAmount: number;
  discrepancy: number;
}

export class AnomalyService {
  static async logCashGapAnomaly(
    storeId: string,
    shiftId: string,
    attendantId: string | null,
    payload: CashGapPayload
  ) {
    // Only log if discrepancy is more than 5000
    if (Math.abs(payload.discrepancy) <= 5000) {
      return;
    }

    await database.write(async () => {
      await database.get('operational_anomalies').create((anomaly: any) => {
        anomaly.storeId = storeId;
        anomaly.shiftId = shiftId;
        anomaly.attendantId = attendantId;
        anomaly.anomalyType = "CASH_GAP";
        anomaly.severity = "high";
        anomaly.payload = JSON.stringify(payload);
        anomaly.resolved = false;
      });
    });
  }

  static async logVoidThresholdAnomaly(
    storeId: string,
    shiftId: string,
    attendantId: string | null,
    voidCount: number
  ) {
    await database.write(async () => {
      await database.get('operational_anomalies').create((anomaly: any) => {
        anomaly.storeId = storeId;
        anomaly.shiftId = shiftId;
        anomaly.attendantId = attendantId;
        anomaly.anomalyType = "VOID_THRESHOLD";
        anomaly.severity = "high";
        anomaly.payload = JSON.stringify({ voidCount });
        anomaly.resolved = false;
      });
    });
  }

  static async logUnrecognizedDeviceAnomaly(
    storeId: string,
    attendantId: string,
    deviceFingerprint: string
  ) {
    await database.write(async () => {
      await database.get('operational_anomalies').create((anomaly: any) => {
        anomaly.storeId = storeId;
        anomaly.attendantId = attendantId;
        anomaly.anomalyType = "UNRECOGNIZED_DEVICE";
        anomaly.severity = "critical";
        anomaly.payload = JSON.stringify({ deviceFingerprint });
        anomaly.resolved = false;
      });
    });
  }

  static async markAnomalyResolved(anomalyId: string) {
    await database.write(async () => {
      const anomaly = await database.get('operational_anomalies').find(anomalyId);
      await anomaly.update((a: any) => {
        a.resolved = true;
      });
    });
  }
}
