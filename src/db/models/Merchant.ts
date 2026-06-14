import { Model } from '@nozbe/watermelondb';
import { field, relation, date, readonly } from '@nozbe/watermelondb/decorators';

export class Merchant extends Model {
  static table = 'merchants';

  @field('email') email!: string;
  @field('phone') phone?: string;
}
