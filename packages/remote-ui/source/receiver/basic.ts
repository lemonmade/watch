import {
  createRemoteMutationCallback,
  type RemoteMutationCallback,
} from '../callback.ts';
import {NODE_TYPE_ELEMENT, NODE_TYPE_ROOT, ROOT_ID} from '../constants.ts';
import type {
  RemoteTextSerialization,
  RemoteElementSerialization,
} from '../types.ts';

export interface RemoteReceiverText extends RemoteTextSerialization {
  readonly version: number;
}

export interface RemoteReceiverElement
  extends Omit<RemoteElementSerialization, 'children' | 'properties'> {
  readonly properties: NonNullable<RemoteElementSerialization['properties']>;
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

type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export class RemoteReceiver {
  readonly root: RemoteReceiverRoot = {
    id: ROOT_ID,
    kind: NODE_TYPE_ROOT,
    children: [],
    version: 0,
  };

  private readonly attached = new Map<
    string | typeof ROOT_ID,
    RemoteReceiverNode
  >([[ROOT_ID, this.root]]);

  private readonly subscribers = new Map<
    string | typeof ROOT_ID,
    Set<(value: RemoteReceiverNode) => void>
  >();

  readonly receive: RemoteMutationCallback;

  constructor() {
    const {attached, subscribers} = this;

    this.receive = createRemoteMutationCallback({
      insertChild: (id, child, index) => {
        const parent = attached.get(id) as Writable<RemoteReceiverParent>;

        const {children} = parent;

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

        parent.version += 1;

        runSubscribers(parent);
      },
      removeChild: (id, index) => {
        const parent = attached.get(id) as Writable<RemoteReceiverParent>;

        const {children} = parent;

        const [removed] = (children as Writable<typeof children>).splice(
          index,
          1,
        );
        parent.version += 1;

        detach(removed!);
        runSubscribers(parent);
      },
      updateProperty: (id, property, value) => {
        const element = attached.get(id) as Writable<RemoteReceiverElement>;

        // retain(value);

        // const oldValue = element.properties[property];

        element.properties[property] = value;
        element.version += 1;

        runSubscribers(element);

        // release(oldValue);
      },
      updateText: (id, newText) => {
        const text = attached.get(id) as Writable<RemoteReceiverText>;

        text.data = newText;
        text.version += 1;

        runSubscribers(text);
      },
    });

    function runSubscribers(attached: RemoteReceiverNode) {
      const subscribed = subscribers.get(attached.id);

      if (subscribed) {
        for (const subscriber of subscribed) {
          subscriber(attached);
        }
      }
    }

    function attach(child: RemoteReceiverChild) {
      attached.set(child.id, child);

      if ('children' in child) {
        for (const grandChild of child.children) {
          attach(grandChild);
        }
      }
    }

    function detach(child: RemoteReceiverChild) {
      attached.delete(child.id);

      if ('children' in child) {
        for (const grandChild of child.children) {
          detach(grandChild);
        }
      }
    }
  }

  get<T extends RemoteReceiverNode>({id}: Pick<T, 'id'>): T | undefined {
    return this.attached.get(id) as any;
  }

  subscribe<T extends RemoteReceiverNode>(
    {id}: T,
    subscriber: (value: T) => void,
    {signal}: {signal?: AbortSignal} = {},
  ) {
    let subscribersSet = this.subscribers.get(id);

    if (subscribersSet == null) {
      subscribersSet = new Set();
      this.subscribers.set(id, subscribersSet);
    }

    subscribersSet.add(subscriber as any);

    signal?.addEventListener('abort', () => {
      subscribersSet!.delete(subscriber as any);

      if (subscribersSet!.size === 0) {
        this.subscribers.delete(id);
      }
    });
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
    (node as any).properties ??= {};
    (node as any).children.forEach((child: T) =>
      normalizeNode(child, normalizer),
    );
  }
  return normalizer(node);
}
