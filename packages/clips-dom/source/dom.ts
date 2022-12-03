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
import {type HTMLAdaptorForRemoteComponent} from './adaptor';

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
  defineElements(): void;
  createRootElement(root: RemoteRoot<any, any>): Element;
  createFragmentElement(fragment: RemoteFragment<any>): Element;
}

export function createRemoteDOM({
  elements,
}: {
  elements: {[Key: string]: HTMLAdaptorForRemoteComponent<any>};
}): RemoteDOM {
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
  const propsByNode = new WeakMap<Element, Record<string, unknown>>();
  const localNameToComponents = new Map<string, string>();

  for (const [element, elementAdaptor] of Object.entries(elements)) {
    localNameToComponents.set(element, elementAdaptor.type);
  }

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
      const name = `on${type[0]!.toUpperCase()}${type.slice(1)}`;
      const nameLower = `on${type}`;

      let props = propsByNode.get(element as HTMLElement);

      if (props == null) {
        props = {};
        propsByNode.set(element as HTMLElement, props);
      }

      const wrappedListener = (...args: any[]) => {
        const result = listener({detail: args.length <= 1 ? args[0] : args});
        return result.returnValue;
      };

      props[name] = listener;
      props[nameLower] = listener;

      for (const component of eachComponent(element as HTMLElement)) {
        component.updateProps({
          [name]: listener,
          [nameLower]: listener,
        });
      }
    },
    removeListener(element, eventType) {
      const type = eventType[0]!.toLowerCase() + eventType.slice(1);
      const name = `on${type[0]!.toUpperCase()}${type.slice(1)}`;
      const nameLower = `on${type}`;

      const props = propsByNode.get(element as HTMLElement);

      if (props != null) {
        delete props[name];
        delete props[nameLower];
      }

      for (const component of eachComponent(element as HTMLElement)) {
        component.updateProps({
          [name]: undefined,
          [nameLower]: undefined,
        });
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
    defineElements() {
      for (const [name, elementAdaptor] of Object.entries(elements)) {
        const Constructor = elementAdaptor.getElementConstructor();
        customElements.define(name, elementAdaptor.getElementConstructor());
        customElements.define(elementAdaptor.type, Constructor);
      }
    },
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

    if (roots) yield* roots.values();
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
      const localName = (node as Element).localName;

      const child = root.createComponent(
        localNameToComponents.get(localName) ?? localName,
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
