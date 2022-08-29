import {type ThreadSignal} from '@watching/thread-signals';
import {type ExtensionPoint as AllowedExtensionPoint} from '../extension-points';

export type Version = 'unstable';

export interface StandardApi<ExtensionPoint extends AllowedExtensionPoint> {
  readonly version: Version;
  readonly extensionPoint: ExtensionPoint;
  readonly settings: ThreadSignal<Record<string, unknown>>;
}
