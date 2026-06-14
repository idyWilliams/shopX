import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class Store extends Model {
  static table = 'stores';

  @field('merchant_id') merchantId!: string;
  @field('name') name!: string;
  @field('location_address') locationAddress?: string;
}
