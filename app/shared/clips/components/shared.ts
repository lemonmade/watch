import {
  useRef,
  useEffect,
  forwardRef,
  type ForwardRefExoticComponent,
  type ForwardRefRenderFunction,
} from 'react';
import {type Elements} from '@watching/clips';
import {type RemoteElement} from '@lemonmade/remote-ui/elements';
import {
  useRemoteReceived,
  useReactPropsForElement,
  type RemoteComponentType,
  type RemoteComponentProps,
  type RemoteComponentRendererProps,
} from '@lemonmade/remote-ui-react/host';
import {createThreadAbortSignal} from '@quilted/quilt/threads';
import {
  signal,
  isThreadSignal,
  type Signal,
  type ThreadSignal,
} from '@watching/thread-signals';

export type ReactComponentPropsForClipsElement<Element extends keyof Elements> =
  Elements[Element] extends RemoteElement<infer Properties, infer Slots>
    ? RemoteComponentProps<Properties, Slots>
    : never;

export type ReactComponentTypeForClipsElement<Element extends keyof Elements> =
  Elements[Element] extends RemoteElement<infer Properties, infer Slots>
    ? RemoteComponentType<Properties, Slots>
    : never;

export function createClipsComponent<Element extends keyof Elements>(
  element: Element,
  Component: ForwardRefRenderFunction<
    any,
    ReactComponentPropsForClipsElement<Element>
  >,
): ForwardRefExoticComponent<RemoteComponentRendererProps> {
  const ClipsComponent = forwardRef<any, RemoteComponentRendererProps>(
    function ClipsComponent({element, receiver, components}, ref) {
      const currentElement = useRemoteReceived(element, receiver) ?? element;
      const props = useReactPropsForElement<
        ReactComponentPropsForClipsElement<Element>
      >(currentElement, {
        receiver,
        components,
      });

      return Component(props!, ref);
    },
  );

  ClipsComponent.displayName = `Clips(${element})`;

  return ClipsComponent;
}

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
