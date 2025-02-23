import type {
  ComponentType,
  RefObject,
  ComponentChild,
  ComponentChildren,
} from 'preact';
import {useRef, useEffect} from 'preact/hooks';
import {
  ElementConstructors,
  type Elements,
  type ClipsElement,
} from '@watching/clips';
import {
  renderRemoteNode,
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

export type {RemoteComponentRendererProps};

export type PreactComponentPropsForClipsElement<
  Element extends keyof Elements,
> =
  Elements[Element] extends ClipsElement<infer Attributes, infer _Events>
    ? Partial<Attributes>
    : RemoteComponentPropsFromElementConstructor<ElementConstructors[Element]>;

export type PreactComponentTypeForClipsElement<Element extends keyof Elements> =
  RemoteComponentTypeFromElementConstructor<ElementConstructors[Element]>;

export function createClipsComponentRenderer<Element extends keyof Elements>(
  element: Element,
  Component: ComponentType<RemoteComponentRendererProps>,
) {
  Component.displayName = `ClipsRenderer(${element})`;

  return Component;
}

type RenderedChildren<SlotProps extends string = string> = {
  [Prop in SlotProps]?: ComponentChild;
} & {children: ComponentChildren};

export function useRenderedChildren<SlotProps extends string = string>(
  props: RemoteComponentRendererProps,
  {slotProps}: {slotProps?: readonly SlotProps[]} = {},
): RenderedChildren<SlotProps> {
  const {element} = props;

  const reactChildren: ReturnType<typeof renderRemoteNode>[] = [];
  const resolved: RenderedChildren<SlotProps> = {children: reactChildren};

  for (const child of element.children.value) {
    let slot: string | undefined =
      child.type === 1 && slotProps?.length
        ? (child.properties.peek().slot as any)
        : undefined;

    if (typeof slot !== 'string') slot = undefined;
    if (typeof slot === 'string' && !slotProps?.includes(slot as any))
      slot = undefined;

    if (slot) {
      const rendered = renderRemoteNode(child, props);
      resolved[slot as SlotProps] = rendered as any;
    } else {
      reactChildren.push(renderRemoteNode(child, props));
    }
  }

  return resolved;
}

// export function useEventProps<
//   Props extends Record<string, (...args: any) => void>,
// >(
//   {element}: Pick<RemoteComponentRendererProps, 'element'>,
//   {eventProps}: {eventProps?: Record<string, keyof Props>} = {},
// ) {
//   const props: Props = {} as any;

//   for (const [event, listener] of Object.entries(
//     element.eventListeners.value,
//   )) {
//     if (typeof listener !== 'function') continue;

//     const eventProp = (eventProps?.[event] ?? `on${event}`) as keyof Props;

//     props[eventProp] = wrapEventListenerForCallback(listener) as any;
//   }

//   return props;
// }

export function wrapEventListenerForCallback(
  listener: (...args: any[]) => any,
) {
  return function eventListenerCallbackWrapper(this: any, ...args: any[]) {
    if (args.length === 1 && args[0] instanceof Event) {
      const event = args[0];
      if (event.target !== event.currentTarget) return;

      return 'detail' in event ? listener(event.detail) : listener();
    }

    return listener.call(this, args);
  };
}

interface UseImplementationRefInternals<T = unknown>
  extends Pick<RemoteComponentRendererProps, 'receiver'> {
  id: string;
  instanceRef: RefObject<T>;
}

export function useImplementarionRef<T>({
  element,
  receiver,
}: Pick<RemoteComponentRendererProps, 'element' | 'receiver'>) {
  const internalsRef = useRef<UseImplementationRefInternals<T>>();

  const {id} = element;

  if (internalsRef.current == null) {
    const internals: UseImplementationRefInternals<T> = {
      id,
      receiver,
    } as any;

    internals.instanceRef = createImplementationRef<T>(internals);
    internalsRef.current = internals;
  }

  internalsRef.current.id = id;
  internalsRef.current.receiver = receiver;

  useEffect(() => {
    const node = {id};

    receiver.implement(node, internalsRef.current?.instanceRef.current as any);

    return () => {
      receiver.implement(node, null);
    };
  }, [id, receiver]);

  return internalsRef.current.instanceRef;
}

function createImplementationRef<T = unknown>(
  internals: Pick<UseImplementationRefInternals<T>, 'id' | 'receiver'>,
): RefObject<T> {
  let current: any = null;

  return {
    get current() {
      return current;
    },
    set current(implementation) {
      current = implementation;
      internals.receiver.implement(internals, implementation as any);
    },
  };
}

export function isAllowedValue<T extends string>(
  value: string | null | undefined,
  allowed: Set<T>,
): value is T {
  return value != null && allowed.has(value as T);
}

export function restrictToAllowedValues<T extends string>(
  value: string | null | undefined,
  allowed: Set<T>,
): T | undefined {
  if (isAllowedValue(value, allowed)) return value as T;
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
