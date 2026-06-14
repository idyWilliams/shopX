import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class DeviceRegistry extends Model {
  static table = 'device_registry';

  @field('device_fingerprint')
  deviceFingerprint!: string;

  @field('authorized_network_bssid')
  authorizedNetworkBssid?: string;

  @field('is_trusted')
  isTrusted!: boolean;

  @readonly
  @date('last_login')
  lastLogin!: Date;
}