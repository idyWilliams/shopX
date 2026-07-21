import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class PendingTransfer extends Model {
  static table = 'pending_transfers'

  @field('store_id') storeId!: string
  @field('ticket_id') ticketId!: string | null
  @field('sale_id') saleId!: string | null
  @field('amount') amount!: number
  @field('currency') currency!: string
  @field('status') status!: string // 'initiated' | 'confirmed' | 'failed'
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('confirmed_at') confirmedAt!: Date | null
}
