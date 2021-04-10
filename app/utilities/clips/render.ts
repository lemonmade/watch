import {useEffect, useMemo, useState, useRef} from 'react';

import {createRemoteReceiver} from '@remote-ui/core';
import type {
  RemoteReceiver,
  IdentifierForRemoteComponent,
} from '@remote-ui/core';
import type {ReactComponentTypeFromRemoteComponentType} from '@remote-ui/react/host';
import {createRemoteSubscribable} from '@remote-ui/async-subscription';
import type {RemoteSubscribable} from '@remote-ui/async-subscription';
import type {
  AnyComponent,
  ExtensionPoint,
  ApiForExtensionPoint,
  AllowedComponentsForExtensionPoint,
} from '@watching/clips';

import {useExtensionSandbox} from './worker';
import type {
  ExtensionSandbox,
  SandboxController,
  SandboxControllerTiming,
  Options as BaseOptions,
} from './worker';

export interface Options<T extends ExtensionPoint> extends BaseOptions {
  api: Omit<
    ApiForExtensionPoint<T>,
    'extensionPoint' | 'version' | 'configuration'
  >;
  components: ReactComponentsForRuntimeExtension<T>;
  extensionPoint: T;
  configuration?: string;
}

export type ReactComponentsForRuntimeExtension<T extends ExtensionPoint> = {
  [Identifier in IdentifierForRemoteComponent<
    AllowedComponentsForExtensionPoint<T>
  >]: ReactComponentTypeFromRemoteComponentType<
    Extract<AnyComponent, Identifier>
  >;
};

export interface RenderControllerTiming extends SandboxControllerTiming {
  readonly renderStart?: number;
  readonly renderEnd?: number;
}

interface RenderControllerInternals<_T extends ExtensionPoint> {
  configuration: {update(value: Record<string, unknown>): void};
}

export interface RenderController<T extends ExtensionPoint> {
  readonly id: string;
  readonly timings: RenderControllerTiming;
  readonly sandbox: ExtensionSandbox;
  readonly state: SandboxController['state'] | 'rendering' | 'rendered';
  readonly internals: RenderControllerInternals<T>;
  on(
    event: 'start' | 'stop' | 'load' | 'render',
    handler: () => void,
  ): () => void;
  render(receiver?: RemoteReceiver): void;
  restart(): Promise<void>;
}

export function useRenderSandbox<T extends ExtensionPoint>({
  api: customApi,
  components,
  extensionPoint,
  configuration,
  ...options
}: Options<T>) {
  const [sandbox, controller] = useExtensionSandbox(options);

  const [receiver, setReceiver] = useState(() => createRemoteReceiver());
  const renderArgumentsRef = useRef<any[]>(undefined as any);
  renderArgumentsRef.current = [
    extensionPoint,
    options.version,
    receiver,
    components,
    customApi,
  ];

  const renderController = useMemo<RenderController<ExtensionPoint>>(() => {
    let api: ApiForExtensionPoint<T>;
    let internals: RenderControllerInternals<T>;
    let timings: {renderStart?: number; renderEnd?: number} | undefined;
    const listeners = new Map<'render', Set<() => void>>();

    const controller: RenderController<ExtensionPoint> = {
      sandbox,
      timings: {
        get start() {
          return controller.timings.start;
        },
        get loadStart() {
          return controller.timings.loadStart;
        },
        get loadEnd() {
          return controller.timings.loadEnd;
        },
        get renderStart() {
          return timings?.renderStart;
        },
        get renderEnd() {
          return timings?.renderEnd;
        },
      },
      get id() {
        return controller.id;
      },
      get state() {
        if (timings) {
          return timings.renderEnd ? 'rendered' : 'rendering';
        }

        return controller.state;
      },
      get internals() {
        return internals;
      },
      render(explicitReceiver?: RemoteReceiver) {
        if (timings != null) return;

        const currentId = controller.id;

        const [
          extensionPoint,
          version,
          receiver,
          components,
          customApi = {},
        ] = renderArgumentsRef.current;

        if (controller.state === 'loaded') {
          timings = {renderStart: Date.now()};
        } else {
          const unlisten = controller.on('load', () => {
            unlisten();
            if (controller.id !== currentId) return;
            timings = {renderStart: Date.now()};
          });
        }

        const finalReceiver: RemoteReceiver = explicitReceiver ?? receiver;

        finalReceiver.on('mount', () => {
          if (timings && controller.id === currentId) {
            timings.renderEnd = Date.now();
            emit('render');
          }
        });

        const [
          configurationSubscribable,
          updateConfiguration,
        ] = createStaticRemoteSubscribable<Record<string, unknown>>(
          JSON.parse(configuration ?? '{}'),
        );

        internals = {
          configuration: {update: updateConfiguration},
        };

        api = {
          ...customApi,
          version,
          extensionPoint,
          configuration: configurationSubscribable,
        };

        sandbox.render(
          extensionPoint,
          finalReceiver.receive,
          Object.keys(components),
          api as any,
        );
      },
      restart() {
        timings = undefined;
        return controller.restart();
      },
      on(event, handler) {
        switch (event) {
          case 'render': {
            let listenersForEvent = listeners.get(event);

            if (listenersForEvent == null) {
              listenersForEvent = new Set();
              listeners.set(event, listenersForEvent);
            }

            listenersForEvent.add(handler);

            return () => {
              listenersForEvent!.delete(handler);
            };
          }
          default: {
            return controller.on(event, handler);
          }
        }
      },
    };

    return controller;

    function emit(event: 'render') {
      const listenersForEvent = listeners.get(event);
      if (listenersForEvent == null) return;

      for (const listener of listenersForEvent) {
        listener();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandbox, controller, extensionPoint]);

  useEffect(() => {
    const initialId = controller.id;
    renderController.render();

    return controller.on('start', () => {
      if (initialId === controller.id) return;
      const newReceiver = createRemoteReceiver();
      renderController.render(newReceiver);
      setReceiver(newReceiver);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, sandbox]);

  return [receiver, renderController] as const;
}

function createStaticRemoteSubscribable<T>(
  initial: T,
): [RemoteSubscribable<T>, (update: T) => void] {
  let current = initial;
  const subscribers = new Set<
    Parameters<RemoteSubscribable<T>['subscribe']>[0]
  >();

  const update = (value: T) => {
    current = value;

    for (const subscriber of subscribers) {
      subscriber(value);
    }
  };

  const subscribable = createRemoteSubscribable({
    get current() {
      return current;
    },
    subscribe: (subscriber) => {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
  });

  return [subscribable, update];
}
