import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class CashDrawerLog extends Model {
  static table = 'cash_drawer_logs'

  @field('store_id') storeId!: string
  @field('shift_id') shiftId!: string
  @field('event_type') eventType!: string
  @field('expected_amount') expectedAmount!: number
  @field('actual_amount') actualAmount!: number
  @field('discrepancy') discrepancy?: number
  
  @readonly @date('created_at') createdAt!: Date
}
