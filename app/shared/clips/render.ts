import {useEffect, useMemo, useState, useRef} from 'react';

import {
  KIND_COMPONENT,
  KIND_FRAGMENT,
  KIND_ROOT,
  isRemoteFragment,
  ACTION_MOUNT,
  ACTION_INSERT_CHILD,
  ACTION_REMOVE_CHILD,
  ACTION_UPDATE_PROPS,
  ACTION_UPDATE_TEXT,
} from '@remote-ui/core';
import type {
  RemoteChannel,
  RemoteReceiver,
  RemoteTextSerialization,
  RemoteComponentSerialization,
  RemoteFragmentSerialization,
  IdentifierForRemoteComponent,
  RemoteReceiverAttachable,
  RemoteReceiverAttachableRoot,
  RemoteReceiverAttachableComponent,
  RemoteReceiverAttachableText,
  RemoteReceiverAttachableChild,
  RemoteReceiverAttachableFragment,
  ActionArgumentMap,
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
import {retain, release} from '@quilted/quilt/threads';
import {createEmitter} from '@quilted/quilt';
import type {Emitter} from '@quilted/quilt';

import {useExtensionSandbox} from './worker';
import type {
  ExtensionSandbox,
  SandboxController,
  SandboxControllerTiming,
  Options as BaseOptions,
} from './worker';

export interface Options<T extends ExtensionPoint> extends BaseOptions {
  api: Omit<ApiForExtensionPoint<T>, 'extensionPoint' | 'version' | 'settings'>;
  components: ReactComponentsForRuntimeExtension<T>;
  extensionPoint: T;
  settings?: string;
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
  settings: {update(value: Record<string, unknown>): void};
}

export interface RenderControllerEventMap {
  start: void;
  stop: void;
  load: void;
  render: void;
}

export interface RenderController<T extends ExtensionPoint> {
  readonly id: string;
  readonly timings: RenderControllerTiming;
  readonly sandbox: ExtensionSandbox;
  readonly state: SandboxController['state'] | 'rendering' | 'rendered';
  readonly internals: RenderControllerInternals<T>;
  readonly on: Emitter<RenderControllerEventMap>['on'];
  render(receiver?: RemoteReceiver): void;
  restart(): Promise<void>;
}

export function useRenderSandbox<T extends ExtensionPoint>({
  api: customApi,
  components,
  extensionPoint,
  settings,
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
    const emitter = createEmitter<RenderControllerEventMap>();

    const renderController: RenderController<ExtensionPoint> = {
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

        const [extensionPoint, version, receiver, components, customApi = {}] =
          renderArgumentsRef.current;

        if (controller.state === 'loaded') {
          timings = {renderStart: Date.now()};
        } else {
          controller.on(
            'load',
            () => {
              if (controller.id !== currentId) return;
              timings = {renderStart: Date.now()};
            },
            {once: true},
          );
        }

        const finalReceiver: RemoteReceiver = explicitReceiver ?? receiver;

        finalReceiver.on('mount', () => {
          if (timings && controller.id === currentId) {
            timings.renderEnd = Date.now();
            emitter.emit('render');
          }
        });

        const [settingsSubscribable, updateConfiguration] =
          createStaticRemoteSubscribable<Record<string, unknown>>(
            JSON.parse(settings ?? '{}'),
          );

        internals = {
          settings: {update: updateConfiguration},
        };

        api = {
          ...customApi,
          version,
          extensionPoint,
          settings: settingsSubscribable,
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
      on: emitter.on,
    };

    return renderController;
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

const ROOT_ID = Symbol.for('RemoteUi.Root') as any;

function createRemoteReceiver(): RemoteReceiver {
  const queuedUpdates = new Set<RemoteReceiverAttachable>();
  const listeners = new Map<
    Parameters<RemoteReceiver['on']>[0],
    Set<Parameters<RemoteReceiver['on']>[1]>
  >();

  const attachmentSubscribers = new Map<
    string | typeof ROOT_ID,
    Set<(value: RemoteReceiverAttachable) => void>
  >();

  let timeout: Promise<void> | null = null;
  let state: RemoteReceiver['state'] = 'unmounted';

  const root: RemoteReceiverAttachableRoot = {
    id: ROOT_ID,
    kind: KIND_ROOT,
    children: [],
    version: 0,
  };

  const attachedNodes = new Map<
    string | typeof ROOT_ID,
    RemoteReceiverAttachable
  >([[ROOT_ID, root]]);

  const receive = createRemoteChannel({
    mount: (children) => {
      const root = attachedNodes.get(ROOT_ID) as RemoteReceiverAttachableRoot;

      const normalizedChildren = children.map((child) =>
        normalizeNode(child, addVersion),
      );

      root.version += 1;
      root.children = normalizedChildren;

      state = 'mounted';

      for (const child of normalizedChildren) {
        retain(child);
        attach(child);
      }

      enqueueUpdate(root).then(() => {
        emit('mount');
      });
    },
    insertChild: (id, index, child) => {
      const attached = attachedNodes.get(
        id ?? ROOT_ID,
      ) as RemoteReceiverAttachableRoot;

      const normalizedChild = normalizeNode(child, addVersion);
      retain(normalizedChild);
      attach(normalizedChild);

      const {children} = attached;

      if (index === children.length) {
        children.push(normalizedChild);
      } else {
        children.splice(index, 0, normalizedChild);
      }

      attached.version += 1;

      enqueueUpdate(attached);
    },
    removeChild: (id, index) => {
      const attached = attachedNodes.get(
        id ?? ROOT_ID,
      ) as RemoteReceiverAttachableRoot;

      const {children} = attached;

      const [removed] = children.splice(index, 1);
      attached.version += 1;

      detach(removed!);

      enqueueUpdate(attached).then(() => {
        release(removed);
      });
    },
    updateProps: (id, newProps) => {
      const component = attachedNodes.get(
        id,
      ) as RemoteReceiverAttachableComponent;

      const oldProps = {...(component.props as any)};

      retain(newProps);

      Object.keys(newProps).forEach((key) => {
        const newProp = (newProps as any)[key];
        const oldProp = (oldProps as any)[key];
        if (isRemoteReceiverAttachableFragment(oldProp)) {
          detach(oldProp);
        }
        if (isRemoteFragmentSerialization(newProp)) {
          const attachableNewProp = addVersion(newProp);
          attach(attachableNewProp);
        }
      });

      Object.assign(component.props as any, newProps);
      component.version += 1;

      enqueueUpdate(component).then(() => {
        for (const key of Object.keys(newProps)) {
          release((oldProps as any)[key]);
        }
      });
    },
    updateText: (id, newText) => {
      const text = attachedNodes.get(id) as RemoteReceiverAttachableText;

      text.text = newText;
      text.version += 1;
      enqueueUpdate(text);
    },
  });

  return {
    get state() {
      return state;
    },
    receive,
    attached: {
      root,
      get({id}) {
        return (attachedNodes.get(id) as any) ?? null;
      },
      subscribe({id}, subscriber) {
        let subscribers = attachmentSubscribers.get(id);

        if (subscribers == null) {
          subscribers = new Set();
          attachmentSubscribers.set(id, subscribers);
        }

        subscribers.add(subscriber as any);

        return () => {
          const subscribers = attachmentSubscribers.get(id);

          if (subscribers) {
            subscribers.delete(subscriber as any);

            if (subscribers.size === 0) {
              attachmentSubscribers.delete(id);
            }
          }
        };
      },
    },
    flush,
    on(event, listener) {
      let listenersForEvent = listeners.get(event);

      if (listenersForEvent == null) {
        listenersForEvent = new Set();
        listeners.set(event, listenersForEvent);
      }

      listenersForEvent.add(listener);

      return () => {
        const listenersForEvent = listeners.get(event);

        if (listenersForEvent) {
          listenersForEvent.delete(listener);

          if (listenersForEvent.size === 0) {
            listeners.delete(event);
          }
        }
      };
    },
  };

  function flush() {
    return timeout ?? Promise.resolve();
  }

  function emit(event: 'mount') {
    const listenersForEvent = listeners.get(event);

    if (listenersForEvent) {
      for (const listener of listenersForEvent) {
        listener();
      }
    }
  }

  function enqueueUpdate(attached: RemoteReceiverAttachable) {
    timeout =
      timeout ??
      new Promise((resolve) => {
        setTimeout(() => {
          const attachedToUpdate = [...queuedUpdates];

          timeout = null;
          queuedUpdates.clear();

          for (const attached of attachedToUpdate) {
            const subscribers = attachmentSubscribers.get(attached.id);

            if (subscribers) {
              for (const subscriber of subscribers) {
                subscriber(attached);
              }
            }
          }

          resolve();
        }, 0);
      });

    queuedUpdates.add(attached);

    return timeout;
  }

  function attach(
    child: RemoteReceiverAttachableChild | RemoteReceiverAttachableFragment,
  ) {
    attachedNodes.set(child.id, child);

    if (child.kind === KIND_COMPONENT && 'props' in child) {
      const {props = {}} = child as any;
      Object.keys(props).forEach((key) => {
        const prop = props[key];
        if (!isRemoteReceiverAttachableFragment(prop)) return;
        attach(prop);
      });
    }

    if ('children' in child) {
      for (const grandChild of child.children) {
        attach(grandChild);
      }
    }
  }

  function detach(
    child: RemoteReceiverAttachableChild | RemoteReceiverAttachableFragment,
  ) {
    attachedNodes.delete(child.id);

    if (child.kind === KIND_COMPONENT && 'props' in child) {
      const {props = {}} = child as any;
      Object.keys(props).forEach((key) => {
        const prop = props[key];
        if (!isRemoteReceiverAttachableFragment(prop)) return;
        detach(prop);
      });
    }

    if ('children' in child) {
      for (const grandChild of child.children) {
        detach(grandChild);
      }
    }
  }
}

interface RemoteChannelRunner {
  mount(...args: ActionArgumentMap[typeof ACTION_MOUNT]): void;
  insertChild(...args: ActionArgumentMap[typeof ACTION_INSERT_CHILD]): void;
  removeChild(...args: ActionArgumentMap[typeof ACTION_INSERT_CHILD]): void;
  updateProps(...args: ActionArgumentMap[typeof ACTION_UPDATE_PROPS]): void;
  updateText(...args: ActionArgumentMap[typeof ACTION_UPDATE_TEXT]): void;
}

function createRemoteChannel({
  mount,
  insertChild,
  removeChild,
  updateProps,
  updateText,
}: RemoteChannelRunner): RemoteChannel {
  const messageMap = new Map<keyof ActionArgumentMap, (...args: any[]) => any>([
    [ACTION_MOUNT, mount],
    [ACTION_REMOVE_CHILD, removeChild],
    [ACTION_INSERT_CHILD, insertChild],
    [ACTION_UPDATE_PROPS, updateProps],
    [ACTION_UPDATE_TEXT, updateText],
  ]);

  return (type, ...args) => messageMap.get(type)!(...args);
}

function addVersion<T>(
  value: T,
): T extends RemoteTextSerialization
  ? RemoteReceiverAttachableText
  : T extends RemoteComponentSerialization
  ? RemoteReceiverAttachableChild
  : T extends RemoteFragmentSerialization
  ? RemoteReceiverAttachableFragment
  : never {
  (value as any).version = 0;
  return value as any;
}

function normalizeNode<
  T extends
    | RemoteTextSerialization
    | RemoteComponentSerialization
    | RemoteFragmentSerialization,
  R,
>(node: T, normalizer: (node: T) => R) {
  if (node.kind === KIND_FRAGMENT || node.kind === KIND_COMPONENT) {
    (node as any).children.forEach((child: T) =>
      normalizeNode(child, normalizer),
    );
  }
  if (node.kind === KIND_COMPONENT && 'props' in node) {
    const {props} = node as any;
    for (const key of Object.keys(props)) {
      const prop = props[key];
      if (!isRemoteFragmentSerialization(prop)) continue;
      props[key] = normalizeNode(prop as any, normalizer);
    }
  }
  return normalizer(node);
}

export function isRemoteFragmentSerialization(
  object: unknown,
): object is RemoteFragmentSerialization {
  return isRemoteFragment(object) && 'id' in object && 'children' in object;
}

export function isRemoteReceiverAttachableFragment(
  object: unknown,
): object is RemoteReceiverAttachableFragment {
  return isRemoteFragmentSerialization(object) && 'version' in object;
}
