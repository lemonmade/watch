import type {ExtensionPoints} from './extension-points';

export function extension<
  ExtensionPoint extends keyof ExtensionPoints = keyof ExtensionPoints,
>(extension: ExtensionPoints[ExtensionPoint]) {
  return extension;
}
