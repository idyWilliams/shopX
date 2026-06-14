import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'merchants',
      columns: [
        { name: 'email', type: 'string' },
        { name: 'phone', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'stores',
      columns: [
        { name: 'merchant_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'location_address', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'attendants',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'hashed_pin', type: 'string' },
        { name: 'access_level', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'store_attendants',
      columns: [
        { name: 'store_id', type: 'string' },
        { name: 'attendant_id', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'store_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'sku', type: 'string' },
        { name: 'retail_price', type: 'number' },
        { name: 'wholesale_price', type: 'number' },
        { name: 'stock_quantity', type: 'number' },
        { name: 'is_active', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'sales_events',
      columns: [
        { name: 'store_id', type: 'string', isOptional: true },
        { name: 'ticket_id', type: 'string', isOptional: true },
        { name: 'product_id', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'price_at_sale', type: 'number' },
        { name: 'event_type', type: 'string' },
        { name: 'attendant_id', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cash_drawer_logs',
      columns: [
        { name: 'store_id', type: 'string', isOptional: true },
        { name: 'shift_id', type: 'string' },
        { name: 'event_type', type: 'string' },
        { name: 'expected_amount', type: 'number' },
        { name: 'actual_amount', type: 'number' },
        { name: 'discrepancy', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'device_registry',
      columns: [
        { name: 'store_id', type: 'string', isOptional: true },
        { name: 'device_fingerprint', type: 'string' },
        { name: 'authorized_network_bssid', type: 'string', isOptional: true },
        { name: 'is_trusted', type: 'boolean' },
        { name: 'last_login', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'operational_anomalies',
      columns: [
        { name: 'store_id', type: 'string', isOptional: true },
        { name: 'anomaly_type', type: 'string' },
        { name: 'severity', type: 'string' },
        { name: 'payload', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});