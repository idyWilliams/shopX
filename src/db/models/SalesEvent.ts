import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class SalesEvent extends Model {
  static table = 'sales_events';

  @field('ticket_id')
  ticketId?: string;

  @field('product_id')
  productId!: string;

  @field('quantity')
  quantity!: number;

  @field('price_at_sale')
  priceAtSale!: number;

  @field('event_type')
  eventType!: 'SALE' | 'VOID' | 'ADJUSTMENT';

  @field('attendant_id')
  attendantId!: string;

  @readonly
  @date('created_at')
  createdAt!: Date;
}