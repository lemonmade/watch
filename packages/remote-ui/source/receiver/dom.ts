import {
  createRemoteMutationCallback,
  type RemoteMutationCallback,
} from '../callback.ts';
import {
  NODE_TYPE_TEXT,
  NODE_TYPE_ELEMENT,
  ROOT_ID,
  REMOTE_ID,
  REMOTE_PROPERTIES,
} from '../constants.ts';
import type {RemoteNodeSerialization} from '../types.ts';
import {ReceiverOptions} from './shared.ts';

export class DOMRemoteReceiver {
  readonly receive: RemoteMutationCallback;
  readonly root: DocumentFragment | Element = document.createDocumentFragment();

  private readonly attached = new Map<string, Node>();

  constructor({retain, release}: ReceiverOptions = {}) {
    const {attached} = this;

    this.receive = createRemoteMutationCallback({
      insertChild: (id, child, index) => {
        const parent = id === ROOT_ID ? this.root : attached.get(id)!;

        const childElement = createNodeFromRemote(child, (node) => {
          if (REMOTE_ID in node) {
            attached.set(node[REMOTE_ID] as string, node);
          }

          if (retain && REMOTE_PROPERTIES in node) {
            retain(node[REMOTE_PROPERTIES]);
          }
        });

        parent.insertBefore(childElement, parent.childNodes[index] || null);
      },
      removeChild: (id, index) => {
        const parent = id === ROOT_ID ? this.root : attached.get(id)!;
        const child = parent.childNodes[index]!;
        child.remove();

        // TODO release, detach
      },
      updateProperty: (id, property, value) => {
        const element = attached.get(id)!;

        retain?.(value);

        const remoteProperties = (element as any)[REMOTE_PROPERTIES];
        const oldValue = remoteProperties[property];

        remoteProperties[property] = value;
        (element as any)[property] = value;

        release?.(oldValue);
      },
      updateText: (id, newText) => {
        const text = attached.get(id) as Text;
        text.data = newText;
      },
    });
  }

  connect(element: Element) {
    const oldRoot = this.root;
    (this as any).root = element;

    oldRoot.childNodes.forEach((node) => {
      element.appendChild(node);
    });
  }

  disconnect() {
    // DocumentFragment
    if (this.root.nodeType === 11) return;

    const oldRoot = this.root;
    const fragment = new DocumentFragment();
    (this as any).root = fragment;

    oldRoot.childNodes.forEach((node) => {
      fragment.appendChild(node);
    });
  }
}

function createNodeFromRemote(
  node: RemoteNodeSerialization,
  callback?: (node: Node) => void,
) {
  switch (node.type) {
    case NODE_TYPE_ELEMENT: {
      const element = document.createElement(node.element);

      if (node.properties) {
        (element as any)[REMOTE_PROPERTIES] = node.properties;

        for (const property of Object.keys(node.properties)) {
          (element as any)[property] = node.properties[property];
        }
      } else {
        (element as any)[REMOTE_PROPERTIES] = {};
      }

      (element as any)[REMOTE_ID] = node.id;

      callback?.(element);

      for (const child of node.children) {
        element.appendChild(createNodeFromRemote(child, callback));
      }

      return element;
    }
    case NODE_TYPE_TEXT: {
      const text = document.createTextNode(node.data);
      (text as any)[REMOTE_ID] = node.id;
      callback?.(text);
      return text;
    }
    default: {
      throw new Error(`Unknown node type: ${String(node)}`);
    }
  }
}
