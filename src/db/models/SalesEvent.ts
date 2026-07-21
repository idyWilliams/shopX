import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class SalesEvent extends Model {
  static table = 'sales_events'

  @field('store_id') storeId!: string
  @field('ticket_id') ticketId?: string
  @field('product_id') productId?: string
  @field('quantity') quantity!: number
  @field('price_at_sale') priceAtSale!: number
  @field('event_type') eventType!: string
  @field('attendant_id') attendantId?: string
  @field('shift_id') shiftId?: string // Added shift_id
  
  @readonly @date('created_at') createdAt!: Date
}
