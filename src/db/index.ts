import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { mySchema } from './schema';
import { Product } from './models/Product';
import { SalesEvent } from './models/SalesEvent';
import { CashDrawerLog } from './models/CashDrawerLog';
import { DeviceRegistry } from './models/DeviceRegistry';
import { OperationalAnomaly } from './models/OperationalAnomaly';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  jsi: false,
});

export const database = new Database({
  adapter,
  modelClasses: [
    Product,
    SalesEvent,
    CashDrawerLog,
    DeviceRegistry,
    OperationalAnomaly,
  ],
});