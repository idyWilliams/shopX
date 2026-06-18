import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class PriceHistory extends Model {
  static table = 'price_history';

  @field('product_id')
  productId!: string;

  @field('old_retail_price')
  oldRetailPrice?: number;

  @field('new_retail_price')
  newRetailPrice!: number;

  @field('old_wholesale_price')
  oldWholesalePrice?: number;

  @field('new_wholesale_price')
  newWholesalePrice?: number;

  @field('changed_by')
  changedBy!: string;

  @field('reason')
  reason?: string;

  @field('created_at')
  createdAt!: number;
}
