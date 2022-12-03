import {
  NS,
  CHANNEL,
  NAME,
  NamespaceURI,
  NodeType,
  OWNER_DOCUMENT,
} from './constants';
import type {Window} from './Window';
import type {Node} from './Node';
import {Event} from './Event';
import {ParentNode} from './ParentNode';
import {Element} from './Element';
import {SVGElement} from './SVGElement';
import {Text} from './Text';
import {Comment} from './Comment';
import {DocumentFragment} from './DocumentFragment';
import {HTMLTemplateElement} from './HTMLTemplateElement';

export class Document extends ParentNode {
  nodeType = NodeType.DOCUMENT_NODE;
  [NAME] = '#document';

  constructor(public defaultView: Window) {
    super();
    this[OWNER_DOCUMENT] = this;
    // this.documentElement = this.createElement('html');
    // this.body = this.createElement('body');
    // this.documentElement.appendChild(this.body);
  }

  createElement(localName: string) {
    const lowerName = String(localName).toLowerCase();

    if (lowerName === 'template') {
      return createElement(new HTMLTemplateElement(), this, 'template');
    }

    const CustomElement = this.defaultView.customElements.get(localName);

    if (CustomElement) {
      return createElement(new CustomElement() as any, this, localName);
    } else {
      return createElement(new Element(), this, localName);
    }
  }

  createElementNS(localName: string, namespaceURI?: NamespaceURI) {
    if (namespaceURI === NamespaceURI.SVG) {
      return createElement(new SVGElement(), this, localName);
    }

    return createElement(new Element(), this, localName, namespaceURI);
  }

  createTextNode(data: any) {
    return createNode(new Text(data), this);
  }

  createComment(data: any) {
    return createNode(new Comment(data), this);
  }

  createDocumentFragment() {
    return createNode(new DocumentFragment(), this);
  }

  createEvent() {
    return new Event('');
  }
}

export function createNode<T extends Node>(node: T, ownerDocument: Document) {
  Reflect.defineProperty(node, OWNER_DOCUMENT, {
    value: ownerDocument,
    writable: true,
    enumerable: false,
  });

  Reflect.defineProperty(node, CHANNEL, {
    value: ownerDocument[CHANNEL],
    writable: true,
    enumerable: false,
  });

  return node;
}

export function createElement<T extends Element>(
  element: T,
  ownerDocument: Document,
  name: string,
  namespace?: NamespaceURI,
) {
  createNode(element, ownerDocument);

  Reflect.defineProperty(element, NAME, {value: name});

  if (namespace) {
    Reflect.defineProperty(element, NS, {value: namespace});
  }

  return element;
}
