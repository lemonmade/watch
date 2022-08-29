import {type ExtensionPoints, type RenderExtension} from './extension-points';
import {acceptSignals, WithThreadSignals} from './signals';

export function extension<
  ExtensionPoint extends keyof ExtensionPoints = keyof ExtensionPoints,
>(
  run: ExtensionPoints[ExtensionPoint] extends RenderExtension<
    infer Api,
    infer Components
  >
    ? RenderExtension<WithThreadSignals<Api>, Components>
    : never,
): ExtensionPoints[ExtensionPoint] {
  function extension(...args: any[]) {
    const normalizedArgs = [...args];
    normalizedArgs.push(acceptSignals(normalizedArgs.pop()));
    return (run as any)(...normalizedArgs);
  }

  return extension;
}
