import {NS, ATTRIBUTES, NamespaceURI, NodeType} from './constants.ts';
import {ParentNode} from './ParentNode.ts';
import {NamedNodeMap} from './NamedNodeMap.ts';
import {Attr} from './Attr.ts';
import {querySelectorAll, querySelector} from './selectors.ts';
import {serializeNode, serializeChildren, parseHtml} from './serialization.ts';

export class Element extends ParentNode {
  nodeType = NodeType.ELEMENT_NODE;

  [NS] = NamespaceURI.XHTML;
  get namespaceURI() {
    return this[NS];
  }

  [ATTRIBUTES]!: NamedNodeMap;

  [anyProperty: string]: any;

  get attributes() {
    let attributes = this[ATTRIBUTES];
    if (!attributes) {
      attributes = new NamedNodeMap(this);
      this[ATTRIBUTES] = attributes;
    }
    return attributes;
  }

  setAttribute(name: string, value: string) {
    this.attributes.setNamedItem(new Attr(name, value));
  }

  setAttributeNS(namespace: NamespaceURI | null, name: string, value: string) {
    this.attributes.setNamedItemNS(new Attr(name, value, namespace));
  }

  getAttribute(name: string) {
    const attr = this.attributes.getNamedItem(name);
    return attr && attr.value;
  }

  getAttributeNS(namespace: NamespaceURI | null, name: string) {
    const attr = this.attributes.getNamedItemNS(namespace, name);
    return attr && attr.value;
  }

  hasAttribute(name: string) {
    const attr = this.attributes.getNamedItem(name);
    return attr != null;
  }

  hasAttributeNS(namespace: NamespaceURI | null, name: string) {
    const attr = this.attributes.getNamedItemNS(namespace, name);
    return attr != null;
  }

  removeAttribute(name: string) {
    this.attributes.removeNamedItem(name);
  }

  removeAttributeNS(namespace: NamespaceURI | null, name: string) {
    this.attributes.removeNamedItemNS(namespace, name);
  }

  querySelectorAll(selector: string) {
    return querySelectorAll(this, selector);
  }

  querySelector(selector: string) {
    return querySelector(this, selector);
  }

  get outerHTML() {
    return serializeNode(this);
  }

  get innerHTML() {
    return serializeChildren(this);
  }

  set innerHTML(html: any) {
    if (html == null || html === '') {
      this.replaceChildren();
    } else {
      const fragment = parseHtml(String(html), this);
      this.replaceChildren(fragment);
    }
  }
}
