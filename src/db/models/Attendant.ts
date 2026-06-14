import { Model } from '@nozbe/watermelondb';
import { field, relation, date, readonly } from '@nozbe/watermelondb/decorators';

export class Attendant extends Model {
  static table = 'attendants';

  @field('name') name!: string;
  @field('hashed_pin') hashedPin!: string;
  @field('access_level') accessLevel!: string;
}
