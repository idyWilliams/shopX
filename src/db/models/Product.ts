import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class Product extends Model {
  static table = 'products'

  @field('org_id') orgId!: string
  @field('name') name!: string
  @field('category') category?: string
  @field('image_url') imageUrl?: string
  @field('base_currency') baseCurrency!: string
  @field('cost_price') costPrice!: number
  @field('selling_price') sellingPrice!: number
  @field('stock_quantity') stockQuantity!: number
  
  @readonly @date('created_at') createdAt!: Date
}
