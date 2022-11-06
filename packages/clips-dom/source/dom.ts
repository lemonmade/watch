import {
  KIND_COMPONENT,
  KIND_TEXT,
  KIND_FRAGMENT,
  type RemoteRoot,
  type RemoteComponent,
  type RemoteFragment,
  type RemoteText,
} from '@remote-ui/core';

import {type Adaptor} from './protocol';
import {Window} from './dom/Window';
import {CHANNEL, ID, NodeType} from './dom/constants';

export function createWindow({adaptor}: RemoteDOM) {
  const window = new Window();

  Object.defineProperty(window, CHANNEL, {value: adaptor, enumerable: false});
  window.document[CHANNEL] = adaptor;
  // force `document` to be ID#0
  window.document[ID] = 0;

  return window;
}

export interface RemoteDOM {
  readonly adaptor: Adaptor;
  createRootElement(root: RemoteRoot<any, any>): Element;
  createFragmentElement(fragment: RemoteFragment<any>): Element;
}

type Listener = (event: any) => void;
interface ListenerEntry {
  name: string;
  nameLower: string;
  listeners: Set<Listener>;
  proxy: (e: any) => void;
}

export function createRemoteDOM(): RemoteDOM {
  const rootsByNode = new WeakMap<
    Element | Text,
    Map<
      RemoteRoot<any, any>,
      | RemoteRoot<any, any>
      | RemoteComponent<any, any>
      | RemoteText<any>
      | RemoteFragment<any>
    >
  >();
  const listeners = new WeakMap<Element, Map<string, ListenerEntry>>();
  const propsByNode = new WeakMap<Element, Record<string, unknown>>();

  const adaptor: Adaptor = {
    createElement() {
      // noop
    },
    createText() {
      // noop
    },
    setAttribute(element, name, value) {
      const parsedValue = value === '' ? true : value;

      let props = propsByNode.get(element);

      if (props == null) {
        props = {};
        propsByNode.set(element, props);
      }

      props[name] = parsedValue;

      for (const component of eachComponent(element)) {
        component.updateProps({[name]: parsedValue});
      }
    },
    removeAttribute(element, name, _ns) {
      const props = propsByNode.get(element);

      if (props != null) {
        delete props[name];
      }

      for (const component of eachComponent(element)) {
        component.updateProps({[name]: undefined});
      }
    },
    setProperty(element, name, value) {
      let props = propsByNode.get(element);

      if (props == null) {
        props = {};
        propsByNode.set(element, props);
      }

      props[name] = value;

      for (const component of eachComponent(element)) {
        component.updateProps({[name]: value});
      }
    },
    setText(textElement, content) {
      for (const text of eachText(textElement)) {
        text.updateText(content);
      }
    },
    addListener(element, eventType, listener) {
      const type = eventType[0]!.toLowerCase() + eventType.slice(1);

      let lists = listeners.get(element);
      if (!lists) {
        lists = new Map();
        listeners.set(element, lists);
      }

      let events = lists.get(type);
      if (!events) {
        events = {
          name: `on${type[0]!.toUpperCase()}${type.slice(1)}`,
          nameLower: `on${type}`,
          listeners: new Set(),
          proxy(ev: any) {
            for (const fn of events!.listeners) fn(ev);
          },
        };

        lists.set(type, events);
      }

      events.listeners.add(listener);

      if (events.listeners.size === 1) {
        let props = propsByNode.get(element);

        if (props == null) {
          props = {};
          propsByNode.set(element, props);
        }

        props[events.name] = events.proxy;
        props[events.nameLower] = events.proxy;

        for (const component of eachComponent(element)) {
          component.updateProps({
            [events.name]: events.proxy,
            [events.nameLower]: events.proxy,
          });
        }
      }
    },
    removeListener(element, eventType, listener) {
      const type = eventType[0]!.toLowerCase() + eventType.slice(1);

      const lists = listeners.get(element);
      if (!lists) return;

      const events = lists.get(type);
      if (!events) return;

      const {name, nameLower, listeners: listenerFunctions} = events;
      listenerFunctions.delete(listener);

      if (listenerFunctions.size === 0) {
        const props = propsByNode.get(element) || {};

        if (props) {
          delete props[name];
          delete props[nameLower];
        }

        for (const component of eachComponent(element)) {
          component.updateProps({
            [name]: undefined,
            [nameLower]: undefined,
          });
        }
      }
    },
    insert(parent, node, before) {
      for (const [root, remoteParent] of eachRemote(parent)) {
        if (!('appendChild' in remoteParent)) {
          continue;
        }

        const remoteNode = nodeToRemote(node, root);
        const remoteBefore = before && nodeToRemote(before, root);

        if (remoteBefore) {
          remoteParent.insertChildBefore(remoteNode, remoteBefore);
        } else {
          remoteParent.appendChild(remoteNode);
        }
      }
    },
    remove(parent, node) {
      for (const [root, remoteParent] of eachRemote(parent)) {
        if (
          remoteParent.kind !== KIND_COMPONENT &&
          remoteParent.kind !== KIND_FRAGMENT
        ) {
          continue;
        }

        const remoteNode = nodeToRemote(node, root);
        remoteParent.removeChild(remoteNode);
      }
    },
  };

  return {
    adaptor,
    createRootElement(root) {
      const element = document.createElement('#root');
      document.append(element);

      const rootMap = new Map<typeof root, typeof root>();
      rootMap.set(root, root);
      rootsByNode.set(element, rootMap);

      return element;
    },
    createFragmentElement(fragment) {
      const element = document.createElement('#fragment');
      document.append(element);

      const rootMap = new Map<RemoteRoot<any, any>, typeof fragment>();
      rootMap.set(fragment.root, fragment);
      rootsByNode.set(element, rootMap);

      return element;
    },
  };

  function* eachRemote(node: Element | Text) {
    const roots = rootsByNode.get(node);
    if (roots) yield* roots.entries();
  }

  function* eachNode(node: Element | Text) {
    const roots = rootsByNode.get(node);

    if (roots) {
      for (const element of roots.values()) {
        yield element;
      }
    }
  }

  function* eachComponent(element: Element) {
    for (const node of eachNode(element)) {
      if (node.kind === KIND_COMPONENT) yield node;
    }
  }

  function* eachText(text: Text) {
    for (const node of eachNode(text)) {
      if (node.kind === KIND_TEXT) yield node;
    }
  }

  function nodeToRemote(
    node: Element | Text,
    root: RemoteRoot<any, any>,
  ): RemoteComponent<any, any> | RemoteText<any> {
    let roots = rootsByNode.get(node);
    if (roots == null) {
      roots = new Map();
      rootsByNode.set(node, roots);
    }

    const existing = roots.get(root);
    if (existing) return existing as any;

    if (node.nodeType === NodeType.ELEMENT_NODE) {
      const child = root.createComponent(
        (node as Element).localName,
        {...propsByNode.get(node as Element)},
        Array.from((node as Element).childNodes).map((child) =>
          nodeToRemote(child as any, root),
        ),
      );

      roots.set(root, child);
      return child;
    } else {
      const child = root.createText(node.textContent ?? '');
      roots.set(root, child);
      return child;
    }
  }
}
