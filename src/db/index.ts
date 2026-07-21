import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { schema } from './schema'
import { SalesEvent } from './models/SalesEvent'
import { OperationalAnomaly } from './models/OperationalAnomaly'
import { CashDrawerLog } from './models/CashDrawerLog'
import { Lead } from './models/Lead'
import { Product } from './models/Product'
import { StoreAttendant } from './models/StoreAttendant'
import { Shift } from './models/Shift'
import { PendingTransfer } from './models/PendingTransfer'

const adapter = new SQLiteAdapter({
  schema,
  jsi: false, // Use async bridge (required for Expo Go)
  onSetUpError: error => {
    console.error('WatermelonDB setup error', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    SalesEvent,
    OperationalAnomaly,
    CashDrawerLog,
    Lead,
    Product,
    StoreAttendant,
    Shift,
    PendingTransfer
  ],
})

export const getDatabase = () => database;
