import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class Lead extends Model {
  static table = 'leads'

  @field('merchant_id') merchantId!: string
  @field('product_interest') productInterest!: string
  @field('contact_info') contactInfo!: string
  @field('status') status!: string
  
  @readonly @date('created_at') createdAt!: Date
}
