import {Document} from './Document.ts';
import {Event} from './Event.ts';
import {EventTarget} from './EventTarget.ts';
import {Node} from './Node.ts';
import {ParentNode} from './ParentNode.ts';
import {ChildNode} from './ChildNode.ts';
import {Element} from './Element.ts';
import {HTMLElement} from './HTMLElement.ts';
import {SVGElement} from './SVGElement.ts';
import {CharacterData} from './CharacterData.ts';
import {Text} from './Text.ts';
import {Comment} from './Comment.ts';
import {DocumentFragment} from './DocumentFragment.ts';
import {HTMLTemplateElement} from './HTMLTemplateElement.ts';
import {CustomElementRegistryImplementation} from './CustomElementRegistry.ts';

export class Window extends EventTarget {
  name = '';
  parent = this;
  self = this;
  top = this;
  document = new Document(this);
  customElements = new CustomElementRegistryImplementation();
  Event = Event;
  Node = Node;
  ParentNode = ParentNode;
  ChildNode = ChildNode;
  EventTarget = EventTarget;
  DocumentFragment = DocumentFragment;
  Document = Document;
  CharacterData = CharacterData;
  Comment = Comment;
  Text = Text;
  Element = Element;
  HTMLElement = HTMLElement;
  SVGElement = SVGElement;
  HTMLTemplateElement = HTMLTemplateElement;
}
