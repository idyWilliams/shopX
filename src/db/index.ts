import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { schema } from './schema'
import { SalesEvent } from './models/SalesEvent'
import { OperationalAnomaly } from './models/OperationalAnomaly'
import { CashDrawerLog } from './models/CashDrawerLog'
import { Lead } from './models/Lead'
import { Product } from './models/Product'
import { StoreAttendant } from './models/StoreAttendant'

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // Use JSI
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
    StoreAttendant
  ],
})

export const getDatabase = () => database;
