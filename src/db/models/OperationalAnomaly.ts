import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class OperationalAnomaly extends Model {
  static table = 'operational_anomalies';

  @field('anomaly_type')
  anomalyType!: string;

  @field('severity')
  severity!: 'low' | 'medium' | 'critical';

  @field('payload')
  payload?: string;

  @readonly
  @date('created_at')
  createdAt!: Date;
}