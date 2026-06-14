import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { mySchema } from './schema';
import { Merchant } from './models/Merchant';
import { Store } from './models/Store';
import { Attendant } from './models/Attendant';
import { StoreAttendant } from './models/StoreAttendant';
import { Product } from './models/Product';
import { SalesEvent } from './models/SalesEvent';
import { CashDrawerLog } from './models/CashDrawerLog';
import { DeviceRegistry } from './models/DeviceRegistry';
import { OperationalAnomaly } from './models/OperationalAnomaly';
import { Lead } from './models/Lead';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  jsi: false,
});

export const database = new Database({
  adapter,
  modelClasses: [
    Merchant,
    Store,
    Attendant,
    StoreAttendant,
    Product,
    SalesEvent,
    CashDrawerLog,
    DeviceRegistry,
    OperationalAnomaly,
    Lead,
  ],
});