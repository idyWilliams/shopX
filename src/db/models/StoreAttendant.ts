import { Model } from '@nozbe/watermelondb';
import { field, relation, date, readonly } from '@nozbe/watermelondb/decorators';

export class StoreAttendant extends Model {
  static table = 'store_attendants';

  @field('store_id') storeId!: string;
  @field('attendant_id') attendantId!: string;
}
