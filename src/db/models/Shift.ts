import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class Shift extends Model {
  static table = 'shifts'

  @field('store_id') storeId!: string
  @field('attendant_id') attendantId!: string | null
  @readonly @date('opened_at') openedAt!: Date
  @readonly @date('closed_at') closedAt!: Date | null
  @field('opening_cash_float') openingCashFloat!: number
  @field('status') status!: string // 'open' | 'clean' | 'discrepancy_locked'
}
