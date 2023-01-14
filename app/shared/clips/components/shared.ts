import {
  useRef,
  useEffect,
  type ReactElement,
  type ReactNode,
  type ComponentType,
} from 'react';
import {
  type Components,
  type ExtensionPoint,
  type ComponentsForExtensionPoint,
} from '@watching/clips';
import {type RemoteComponentType, type RemoteFragment} from '@remote-ui/core';
import {createThreadAbortSignal} from '@quilted/quilt/threads';
import {
  isThreadSignal,
  signal,
  type Signal,
  type ThreadSignal,
} from '@watching/thread-signals';

type PropsForRemoteComponent<T> = T extends RemoteComponentType<
  string,
  infer Props,
  any
>
  ? Props extends Record<string, never>
    ? {}
    : {[K in keyof Props]: RemoteFragmentToReactElement<Props[K]>}
  : never;

type RemoteFragmentToReactElement<T> = T extends RemoteFragment<any>
  ? ReactElement
  : T;

export type ReactPropsFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = PropsForRemoteComponent<Type> & {
  children?: ReactNode;
};

export type ReactComponentTypeFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = ComponentType<ReactPropsFromRemoteComponentType<Type>>;

export type PropsForClipsComponent<Component extends keyof Components> =
  ReactPropsFromRemoteComponentType<Components[Component]>;

export type ReactComponentsForRemoteComponents<
  Components extends {[key: string]: RemoteComponentType<any, any, any>},
> = {
  [Component in keyof Components]: ReactComponentTypeFromRemoteComponentType<
    Components[Component]
  >;
};

export type ReactComponentsForExtensionPoint<Point extends ExtensionPoint> =
  ReactComponentsForRemoteComponents<ComponentsForExtensionPoint<Point>>;

export function usePossibleThreadSignals<T extends Record<string, any>>(
  values: T,
): T {
  const internals = useRef<{
    signals: WeakMap<
      ThreadSignal<unknown>,
      {
        signal: Signal<unknown>;
        abort: AbortController;
        started: boolean;
        set(value: unknown): void;
      }
    >;
    active: Set<ThreadSignal<unknown>>;
  }>();

  internals.current ??= {
    signals: new WeakMap(),
    active: new Set(),
  };

  internals.current.active.clear();

  const newValues: Record<string, any> = {};

  for (const [key, value] of Object.entries(values)) {
    if (isThreadSignal(value)) {
      let signalDetails = internals.current.signals.get(value);

      if (signalDetails == null) {
        const resolvedSignal = signal(value.initial);

        const valueDescriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(resolvedSignal),
          'value',
        )!;

        Object.defineProperty(resolvedSignal, 'value', {
          ...valueDescriptor,
          get() {
            return valueDescriptor.get?.call(this);
          },
          set(updatedValue) {
            if (value.set == null) {
              throw new Error(
                `You can’t set the value of a readonly thread signal.`,
              );
            }

            value.set(updatedValue);
            return valueDescriptor.set?.call(this, updatedValue);
          },
        });

        signalDetails = {
          signal: resolvedSignal,
          abort: new AbortController(),
          started: false,
          set(value) {
            valueDescriptor.set?.call(resolvedSignal, value);
          },
        };

        internals.current.signals.set(value, signalDetails);
      }

      internals.current.active.add(value);
      newValues[key] = signalDetails.signal;
      continue;
    }

    newValues[key] = value;
  }

  const threadSignals = [...internals.current.active];

  useEffect(() => {
    const {signals, active} = internals.current!;

    for (const threadSignal of threadSignals) {
      const signalDetails = signals.get(threadSignal);

      if (signalDetails == null || signalDetails.started) continue;

      signalDetails.started = true;

      const threadAbortSignal = createThreadAbortSignal(
        signalDetails.abort.signal,
      );

      Promise.resolve(
        threadSignal.start(signalDetails.set, {signal: threadAbortSignal}),
      ).then(signalDetails.set);
    }

    return () => {
      for (const threadSignal of threadSignals) {
        if (active.has(threadSignal)) continue;
        signals.get(threadSignal)?.abort.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, threadSignals);

  return newValues as T;
}
