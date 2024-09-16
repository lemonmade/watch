import {useLayoutEffect, useRef, type ForwardedRef} from 'react';

export function useCustomElementProperties<T extends Element>(
  props: Record<string, any>,
  ref: ForwardedRef<T>,
) {
  const internalsRef = useRef<{
    names: Set<string>;
    values: Record<string, any>;
  }>();
  internalsRef.current ??= {names: new Set(), values: {}};

  useLayoutEffect(() => {
    const internals = internalsRef.current!;
    const oldNames = new Set(internals.names);
    const newNames = new Set(Object.keys(props));

    const element = typeof ref === 'function' ? undefined : ref?.current;

    for (const name of newNames) {
      const newValue = props[name];
      const oldValue = internals.values[name];

      internals.values[name] = newValue;
      oldNames.delete(name);


      if (element != null && newValue !== oldValue) {
        if (name in element) {
          (element as any)[name] = newValue;
        } else if (Boolean(newValue)) {
          element.setAttribute(name, newValue);
        } else {
          element.removeAttribute(name);
        }
      }
    }

    for (const name of oldNames) {
      const oldValue = internals.values[name];
      delete internals.values[name];

      if (element != null && oldValue !== undefined) {
        if (name in element) {
          (element as any)[name] = undefined;
        } else {
          element.removeAttribute(name);
        }
      }
    }

    internals.names = newNames;
  });
}
