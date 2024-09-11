import {RemoteElement} from '@remote-dom/core/elements';

export class ClipsElement<
  Attributes = {},
  Events extends Record<string, any> = {},
> extends RemoteElement<{}, {}, {}, Events> {
  readonly isClipsElement = true;

  // Doing this to force the type to be kept
  readonly __attributes?: Attributes;
}

export function isAllowedValue<T extends string>(
  value: string | null,
  allowed: Set<T>,
): value is T {
  return value !== null && allowed.has(value as T);
}

export function restrictToAllowedValues<T extends string>(
  value: string | null,
  allowed: Set<T>,
): T | undefined {
  if (isAllowedValue(value, allowed)) return value as T;
}
