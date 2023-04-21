import {
  createRemoteMutationCallback,
  type RemoteMutationCallback,
} from './callback.ts';
import {NODE_TYPE_ELEMENT, NODE_TYPE_ROOT, ROOT_ID} from './constants.ts';
import type {
  RemoteTextSerialization,
  RemoteElementSerialization,
} from './types.ts';

export interface RemoteReceiverText extends RemoteTextSerialization {
  readonly version: number;
}

export interface RemoteReceiverElement
  extends Omit<RemoteElementSerialization, 'children'> {
  readonly children: readonly RemoteReceiverChild[];
  readonly version: number;
}

export interface RemoteReceiverRoot {
  readonly id: typeof ROOT_ID;
  readonly kind: typeof NODE_TYPE_ROOT;
  readonly children: readonly RemoteReceiverChild[];
  readonly version: number;
}

export type RemoteReceiverChild = RemoteReceiverText | RemoteReceiverElement;
export type RemoteReceiverNode = RemoteReceiverChild | RemoteReceiverRoot;
export type RemoteReceiverParent = RemoteReceiverElement | RemoteReceiverRoot;

export interface RemoteReceiver {
  readonly root: RemoteReceiverRoot;
  readonly receive: RemoteMutationCallback;
  get<T extends RemoteReceiverParent>(attachable: Pick<T, 'id'>): T | null;
  subscribe<T extends RemoteReceiverParent>(
    {id}: T,
    subscriber: (value: T) => void,
    options?: {signal?: AbortSignal},
  ): void;
}

type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export function createRemoteReceiver(): RemoteReceiver {
  const subscribers = new Map<
    string | typeof ROOT_ID,
    Set<(value: RemoteReceiverNode) => void>
  >();

  const root: RemoteReceiverRoot = {
    id: ROOT_ID,
    kind: NODE_TYPE_ROOT,
    children: [],
    version: 0,
  };

  const attachedNodes = new Map<string | typeof ROOT_ID, RemoteReceiverNode>([
    [ROOT_ID, root],
  ]);

  const receive = createRemoteMutationCallback({
    insertChild: (id, child, index) => {
      const attached = attachedNodes.get(id) as Writable<RemoteReceiverParent>;

      const {children} = attached;

      const normalizedChild = normalizeNode(child, addVersion);

      // retain(normalizedChild);
      attach(normalizedChild);

      if (index === children.length) {
        (children as Writable<typeof children>).push(normalizedChild);
      } else {
        (children as Writable<typeof children>).splice(
          index,
          0,
          normalizedChild,
        );
      }

      attached.version += 1;

      runSubscribers(attached);
    },
    removeChild: (id, index) => {
      const attached = attachedNodes.get(id) as Writable<RemoteReceiverParent>;

      const {children} = attached;

      const [removed] = (children as Writable<typeof children>).splice(
        index,
        1,
      );
      attached.version += 1;

      detach(removed!);
      runSubscribers(attached);
    },
    updateProperty: (id, property, value) => {
      const element = attachedNodes.get(id) as Writable<RemoteReceiverElement>;

      // retain(value);

      // const oldValue = element.properties[property];

      element.properties[property] = value;
      element.version += 1;

      runSubscribers(element);

      // release(oldValue);
    },
    updateText: (id, newText) => {
      console.log({id, newText});
      const text = attachedNodes.get(id) as Writable<RemoteReceiverText>;

      text.data = newText;
      text.version += 1;

      runSubscribers(text);
    },
  });

  return {
    root,
    receive,
    get({id}) {
      return (attachedNodes.get(id) as any) ?? null;
    },
    subscribe({id}, subscriber, {signal} = {}) {
      let subscribersSet = subscribers.get(id);

      if (subscribersSet == null) {
        subscribersSet = new Set();
        subscribers.set(id, subscribersSet);
      }

      subscribersSet.add(subscriber as any);

      signal?.addEventListener('abort', () => {
        subscribersSet!.delete(subscriber as any);

        if (subscribersSet!.size === 0) {
          subscribers.delete(id);
        }
      });
    },
  };

  function runSubscribers(attached: RemoteReceiverNode) {
    const subscribed = subscribers.get(attached.id);

    if (subscribed) {
      for (const subscriber of subscribed) {
        subscriber(attached);
      }
    }
  }

  function attach(child: RemoteReceiverChild) {
    attachedNodes.set(child.id, child);

    if ('children' in child) {
      for (const grandChild of child.children) {
        attach(grandChild);
      }
    }
  }

  function detach(child: RemoteReceiverChild) {
    attachedNodes.delete(child.id);

    if ('children' in child) {
      for (const grandChild of child.children) {
        detach(grandChild);
      }
    }
  }
}

function addVersion<T>(
  value: T,
): T extends RemoteTextSerialization
  ? RemoteReceiverText
  : T extends RemoteElementSerialization
  ? RemoteReceiverElement
  : never {
  (value as any).version = 0;
  return value as any;
}

function normalizeNode<
  T extends RemoteTextSerialization | RemoteElementSerialization,
  R,
>(node: T, normalizer: (node: T) => R) {
  if (node.type === NODE_TYPE_ELEMENT) {
    (node as any).children.forEach((child: T) =>
      normalizeNode(child, normalizer),
    );
  }
  return normalizer(node);
}
