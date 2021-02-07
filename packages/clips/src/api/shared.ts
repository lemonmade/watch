import type {ExtensionPoint as AllowedExtensionPoint} from '../extension-points';

export type Version = 'unstable';

export interface StandardApi<ExtensionPoint extends AllowedExtensionPoint> {
  version: Version;
  extensionPoint: ExtensionPoint;
}
