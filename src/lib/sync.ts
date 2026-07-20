import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db';
import { supabase } from './supabase';

export async function syncData() {
  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        try {
          const { data, error } = await supabase.rpc('pull_sync_changes', {
            last_pulled_at: lastPulledAt,
            schema_version: schemaVersion,
            migration: migration,
          });

          if (error) {
            console.warn('Supabase sync pull error (might be offline):', error.message);
            // Return empty changes if offline to prevent crash
            return { changes: {}, timestamp: lastPulledAt || Date.now() };
          }

          const { changes, timestamp } = data;
          return { changes, timestamp };
        } catch (e: any) {
          console.warn('Network error during pullChanges:', e.message);
          return { changes: {}, timestamp: lastPulledAt || Date.now() };
        }
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        try {
          const { error } = await supabase.rpc('push_sync_changes', {
            changes,
            last_pulled_at: lastPulledAt,
          });

          if (error) {
            console.warn('Supabase sync push error (might be offline):', error.message);
          }
        } catch (e: any) {
          console.warn('Network error during pushChanges:', e.message);
        }
      },
      migrationsEnabledAtVersion: 1,
    });
    console.log('Synchronization completed successfully');
  } catch (error) {
    console.warn('Synchronization failed:', error);
  }
}
