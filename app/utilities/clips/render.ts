import {useEffect, useMemo, useState, useRef} from 'react';

import {createRemoteReceiver} from '@remote-ui/core';
import type {
  RemoteReceiver,
  IdentifierForRemoteComponent,
} from '@remote-ui/core';
import type {ReactComponentTypeFromRemoteComponentType} from '@remote-ui/react/host';
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
  api: Omit<ApiForExtensionPoint<T>, 'extensionPoint' | 'version'>;
  components: ReactComponentsForRuntimeExtension<T>;
  extensionPoint: T;
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

export interface RenderController {
  readonly id: string;
  readonly timings: RenderControllerTiming;
  readonly sandbox: ExtensionSandbox;
  readonly state: SandboxController['state'] | 'rendering' | 'rendered';
  on(
    event: 'start' | 'stop' | 'load' | 'render',
    handler: () => void,
  ): () => void;
  render(receiver?: RemoteReceiver): void;
  restart(): Promise<void>;
}

export function useRenderSandbox<T extends ExtensionPoint>({
  api,
  components,
  extensionPoint,
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
    api,
  ];

  const renderController = useMemo<RenderController>(() => {
    let timings: {renderStart?: number; renderEnd?: number} | undefined;
    const listeners = new Map<'render', Set<() => void>>();

    return {
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
      render(explicitReceiver?: RemoteReceiver) {
        if (timings != null) return;

        const currentId = controller.id;

        const [
          extensionPoint,
          version,
          receiver,
          components,
          api = {},
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

        sandbox.render(
          extensionPoint,
          finalReceiver.receive,
          Object.keys(components),
          {...api, version, extensionPoint},
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
