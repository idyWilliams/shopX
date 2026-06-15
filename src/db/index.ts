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

let _database: Database | null = null;

export const getDatabase = (): Database => {
  if (!_database) {
    const adapter = new SQLiteAdapter({
      schema: mySchema,
      jsi: false,
    });
    _database = new Database({
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
  }
  return _database;
};

// Keep a named export for backward compatibility
export const database = new Proxy({} as Database, {
  get: (_target, prop) => {
    return getDatabase()[prop as keyof Database];
  },
});