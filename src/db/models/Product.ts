import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class Product extends Model {
  static table = 'products';

  @field('store_id')
  storeId?: string;

  @field('name')
  name!: string;

  @field('sku')
  sku!: string;

  @field('retail_price')
  retailPrice!: number;

  @field('wholesale_price')
  wholesalePrice!: number;

  @field('stock_quantity')
  stockQuantity!: number;

  @field('is_active')
  isActive!: boolean;
}