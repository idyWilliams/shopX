import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 3, // Incremented schema version again
  tables: [
    tableSchema({
      name: 'sales_events',
      columns: [
        { name: 'store_id', type: 'string' },
        { name: 'ticket_id', type: 'string', isOptional: true },
        { name: 'product_id', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number' },
        { name: 'price_at_sale', type: 'number' },
        { name: 'event_type', type: 'string' },
        { name: 'attendant_id', type: 'string', isOptional: true },
        { name: 'shift_id', type: 'string', isOptional: true }, // Added shift_id
        { name: 'payment_method', type: 'string', isOptional: true }, // Added payment method
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'shifts',
      columns: [
        { name: 'store_id', type: 'string' },
        { name: 'attendant_id', type: 'string', isOptional: true },
        { name: 'opened_at', type: 'number' },
        { name: 'closed_at', type: 'number', isOptional: true },
        { name: 'opening_cash_float', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'pending_transfers',
      columns: [
        { name: 'store_id', type: 'string' },
        { name: 'ticket_id', type: 'string', isOptional: true },
        { name: 'sale_id', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'confirmed_at', type: 'number', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'operational_anomalies',
      columns: [
        { name: 'store_id', type: 'string' },
        { name: 'shift_id', type: 'string', isOptional: true },
        { name: 'attendant_id', type: 'string', isOptional: true },
        { name: 'anomaly_type', type: 'string' },
        { name: 'severity', type: 'string' },
        { name: 'payload', type: 'string', isOptional: true },
        { name: 'resolved', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'cash_drawer_logs',
      columns: [
        { name: 'store_id', type: 'string' },
        { name: 'shift_id', type: 'string' },
        { name: 'event_type', type: 'string' },
        { name: 'expected_amount', type: 'number' },
        { name: 'actual_amount', type: 'number' },
        { name: 'discrepancy', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'leads',
      columns: [
        { name: 'merchant_id', type: 'string' },
        { name: 'product_interest', type: 'string' },
        { name: 'contact_info', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'org_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'base_currency', type: 'string' },
        { name: 'cost_price', type: 'number' },
        { name: 'selling_price', type: 'number' },
        { name: 'stock_quantity', type: 'number' },
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'store_attendants',
      columns: [
        { name: 'store_id', type: 'string' },
        { name: 'attendant_id', type: 'string' },
        { name: 'access_level', type: 'string' },
        { name: 'created_at', type: 'number' },
      ]
    })
  ]
})
