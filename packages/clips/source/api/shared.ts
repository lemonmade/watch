import {type Signal} from '@preact/signals-core';
import {type ExtensionPoint as AllowedExtensionPoint} from '../extension-points';

export type Version = 'unstable';

export interface StandardApi<ExtensionPoint extends AllowedExtensionPoint> {
  readonly version: Version;
  readonly extensionPoint: ExtensionPoint;
  readonly settings: Signal<Record<string, unknown>>;
}
