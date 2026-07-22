import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class OperationalAnomaly extends Model {
  static table = 'operational_anomalies'

  @field('store_id') storeId!: string
  @field('shift_id') shiftId?: string
  @field('attendant_id') attendantId?: string
  @field('anomaly_type') anomalyType!: string
  @field('severity') severity!: string
  @field('payload') payload?: string
  @field('resolved') resolved!: boolean
  
  @readonly @date('created_at') createdAt!: Date
}
