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

interface BackedByAttributeOptions<T> {
  name?: string;
  parse?(value: string | null): T | undefined;
  serialize?(value: T, context: {current: T; default: T}): string | undefined;
}

export function backedByAttribute<T>({
  name,
  parse,
  serialize,
}: BackedByAttributeOptions<T> = {}) {
  return function (
    _target: any,
    context: ClassAccessorDecoratorContext<HTMLElement, T>,
  ) {
    let defaultValue!: T;
    const attributeName = name ?? (context.name as string);

    return {
      get(this: HTMLElement): T {
        const attribute = this.getAttribute(attributeName);
        return (parse ? parse(attribute) : (attribute as T)) ?? defaultValue;
      },
      set(this: HTMLElement, value: T) {
        const serialized = serialize
          ? serialize(value, {
              current: context.access.get(this),
              default: defaultValue,
            })
          : (value as string);

        if (serialized == null) {
          this.removeAttribute(attributeName);
        } else {
          this.setAttribute(attributeName, serialized);
        }
      },
      init(this: HTMLElement, value: T) {
        defaultValue = value;
        return value;
      },
    };
  };
}

export function backedByAttributeAsBoolean({
  name,
}: Pick<BackedByAttributeOptions<boolean>, 'name'> = {}) {
  return backedByAttribute({
    name,
    parse(value) {
      return value != null;
    },
    serialize(value) {
      return Boolean(value) ? '' : undefined;
    },
  });
}

export function backedByAttributeWithBooleanShorthand<T>({
  name,
  whenTrue,
  parse,
  serialize,
}: {
  name?: string;
  whenTrue: T;
  parse?(value: string | null): T | undefined;
  serialize?(value: T, context: {current: T; default: T}): string | null;
}) {
  return function (
    _target: any,
    context: ClassAccessorDecoratorContext<HTMLElement, T>,
  ) {
    let defaultValue!: T;
    const attributeName = name ?? (context.name as string);

    return {
      get(this: HTMLElement): T {
        const attribute = this.getAttribute(attributeName);
        return (parse ? parse(attribute) : (attribute as T)) ?? defaultValue;
      },
      set(this: HTMLElement, value: T | boolean) {
        const normalizedValue =
          value === true ? whenTrue : value === false ? defaultValue : value;

        const serialized = serialize
          ? serialize(normalizedValue, {
              current: context.access.get(this),
              default: defaultValue,
            })
          : (normalizedValue as string);

        if (!Boolean(serialized) || serialized === defaultValue) {
          this.removeAttribute(attributeName);
        } else {
          this.setAttribute(attributeName, serialized!);
        }
      },
      init(this: HTMLElement, value: T) {
        defaultValue = value;
        return value;
      },
    };
  };
}

export function attributeRestrictedToAllowedValues<T extends string>(
  allowed: Set<T>,
) {
  return {
    parse(value) {
      return restrictToAllowedValues(value, allowed);
    },
    serialize(value, context) {
      return restrictToAllowedValues(value, allowed as any) ?? context.current;
    },
  } satisfies Partial<BackedByAttributeOptions<T>>;
}
