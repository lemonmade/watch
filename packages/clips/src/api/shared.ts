import type {StatefulRemoteSubscribable} from '@remote-ui/async-subscription';
import type {ExtensionPoint as AllowedExtensionPoint} from '../extension-points';

export type Version = 'unstable';

export interface StandardApi<ExtensionPoint extends AllowedExtensionPoint> {
  readonly version: Version;
  readonly extensionPoint: ExtensionPoint;
  readonly configuration: StatefulRemoteSubscribable<Record<string, unknown>>;
}
