import {
  createRemoteRoot,
  type RemoteRoot,
  type RemoteChannel,
  type RemoteComponent,
  type RemoteText,
} from '@remote-ui/core';

import type {AbstractChannel, NodeId} from './protocol';
import {Window} from './dom/Window';
import type {Element} from './dom/Element';
import {CHANNEL, ID} from './dom/constants';

export type {Document} from './dom/Document';
export type {Window} from './dom/Window';
export type {Element} from './dom/Element';

const rootsById = new Map();

export function createWindow() {
  const channel = new RemoteUiChannel();
  const window = new Window();

  Object.defineProperty(window, CHANNEL, {value: channel, enumerable: false});
  window.document[CHANNEL] = channel;
  // force `document` to be ID#0
  window.document[ID] = 0;
  // nodeId--;
  return window;
}

export function createRootElement(channel: RemoteChannel, {document}: Window) {
  const remoteRoot = createRemoteRoot(channel);
  const root = document.createElement('root');
  // (root as any)[GENERATE_ID]();
  rootsById.set((root as any)[ID], remoteRoot);
  document.appendChild(root);
  return root;
}

export function getRemoteRootForElement(element: Element) {
  return rootsById.get(element);
}

type NS = string | null;
type Listener = (event: any) => void;

interface ListenerEntry {
  name: string;
  nameLower: string;
  listeners: Listener[];
  proxy: (e: any) => void;
}

class RemoteUiChannel implements AbstractChannel {
  ready = Promise.resolve();

  private nodes = new Map<
    NodeId,
    RemoteComponent<any, RemoteRoot> | RemoteText<RemoteRoot>
  >();

  private listeners = new Map<NodeId, Map<string, ListenerEntry>>();

  // A map of Nodes to their nearest <root>
  private roots = new Map<NodeId, NodeId>();

  createElement(node: NodeId, localName: string, _ns: NS, parent: NodeId) {
    const root = this.roots.get(parent)!;
    this.roots.set(node, root);
    const remoteRoot = rootsById.get(root);
    if (!remoteRoot) {
      throw Error('Cannot create RemoteComponent, no ancestor RemoteRoot.');
    }
    const component = remoteRoot.createComponent(localName);
    this.nodes.set(node, component);
  }

  setAttribute(node: NodeId, name: string, value: string, _ns?: NS) {
    const parsedValue = value === '' ? true : value;
    this._element(node).updateProps({[name]: parsedValue});
  }

  removeAttribute(node: NodeId, name: string, _ns?: NS) {
    this._element(node).updateProps({[name]: undefined});
  }

  createText(node: NodeId, data: string, parent: NodeId) {
    const root = this.roots.get(parent)!;
    this.roots.set(node, root);
    const remoteRoot = rootsById.get(root);
    const text = remoteRoot.createText(data);
    this.nodes.set(node, text);
  }

  setText(node: NodeId, data: string) {
    this._text(node).updateText(data);
  }

  insert(parent: NodeId, node: NodeId, before: NodeId) {
    let element = this._element(parent);

    // Don't attempt to append roots, just mark them as the root:
    let root = rootsById.get(node);
    if (root !== undefined) {
      this.roots.set(node, node);
      return;
    }
    // alternative: never append directly into Document:
    // if (parent === 0) return;

    // Inherit root from parent:
    const parentRoot = this.roots.get(parent);
    root = rootsById.get(parentRoot);
    if (root !== undefined) {
      this.roots.set(node, parentRoot!);
    }

    // if we are appending into a root, use the remoteRoot
    if (parent === parentRoot) {
      element = root;
    }

    const child = this.nodes.get(node)!;
    if (before == null) {
      element.appendChild(child);
    } else {
      const sibling = this.nodes.get(before)!;
      element.insertChildBefore(child, sibling);
    }
  }

  remove(node: NodeId) {
    const element = this._element(node);
    element.parent?.removeChild(element);
  }

  setProperty(node: NodeId, name: string, value: any) {
    this._element(node).updateProps({[name]: value});
  }

  addListener(node: NodeId, _type: string, listener: Listener) {
    const type = _type[0]!.toLowerCase() + _type.slice(1);
    let lists = this.listeners.get(node);
    if (!lists) {
      lists = new Map();
      this.listeners.set(node, lists);
    }
    let events = lists.get(type);
    if (!events) {
      events = {
        name: `on${type[0]!.toUpperCase()}${type.slice(1)}`,
        nameLower: `on${type}`,
        listeners: [],
        proxy(ev: any) {
          for (const fn of events!.listeners) fn(ev);
        },
      };
      lists.set(type, events);
    }
    const isFirst = events.listeners.push(listener) === 1;
    if (isFirst) {
      this._element(node).updateProps({
        [events.name]: events.proxy,
        [events.nameLower]: events.proxy,
      });
    }
  }

  removeListener(node: NodeId, type: string, listener: Listener) {
    const lists = this.listeners.get(node);
    if (!lists) return;
    const events = lists.get(type);
    if (!events) return;
    const {name, nameLower, listeners} = events;
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
    if (listeners.length === 0) {
      this._element(node).updateProps({
        [name]: undefined,
        [nameLower]: undefined,
      });
    }
  }

  // private _root(node: NodeId) {
  //   const rootId = this.roots.get(node);
  //   const root = this.nodes.get(rootId!);
  //   return ROOTS.get(root!);
  // }

  private _element(id: NodeId) {
    return this.nodes.get(id) as RemoteComponent<any, RemoteRoot>;
  }

  private _text(id: NodeId) {
    return this.nodes.get(id) as RemoteText<RemoteRoot>;
  }
}
