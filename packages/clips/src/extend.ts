import type {ExtensionPoints} from './extension-points';

export function extend<
  ExtensionPoint extends keyof ExtensionPoints = keyof ExtensionPoints,
>(extend: ExtensionPoints[ExtensionPoint]) {
  return extend;
}
