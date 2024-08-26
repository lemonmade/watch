import type {ComponentType} from 'preact';
import {useRef, useEffect} from 'preact/hooks';
import {ElementConstructors, type Elements} from '@watching/clips';
import {
  createRemoteComponentRenderer,
  type RemoteComponentRendererProps,
  type RemoteComponentTypeFromElementConstructor,
  type RemoteComponentPropsFromElementConstructor,
} from '@remote-dom/preact/host';
import {signal, type Signal} from '@quilted/quilt/signals';
import {
  ThreadSignal,
  ThreadAbortSignal,
  type ThreadSignalSerialization,
} from '@quilted/quilt/threads';

export type PreactComponentPropsForClipsElement<
  Element extends keyof Elements,
> = RemoteComponentPropsFromElementConstructor<ElementConstructors[Element]>;

export type PreactComponentTypeForClipsElement<Element extends keyof Elements> =
  RemoteComponentTypeFromElementConstructor<ElementConstructors[Element]>;

export function createClipsComponent<Element extends keyof Elements>(
  element: Element,
  Component: ComponentType<PreactComponentPropsForClipsElement<Element>>,
): ComponentType<RemoteComponentRendererProps> {
  return createRemoteComponentRenderer(Component as any, {
    name: `Clips(${element})`,
  }) as any;
}

export function usePossibleThreadSignals<T extends Record<string, any>>(
  values: T,
): T {
  const internals = useRef<{
    signals: WeakMap<
      ThreadSignalSerialization<unknown>,
      {
        signal: Signal<unknown>;
        abort: AbortController;
        started: boolean;
        set(value: unknown): void;
      }
    >;
    active: Set<ThreadSignalSerialization<unknown>>;
  }>();

  internals.current ??= {
    signals: new WeakMap(),
    active: new Set(),
  };

  internals.current.active.clear();

  const newValues: Record<string, any> = {};

  for (const [key, value] of Object.entries(values)) {
    if (ThreadSignal.isSerialized(value)) {
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

      const threadAbortSignal = ThreadAbortSignal.serialize(
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
  }, threadSignals);

  return newValues as T;
}
