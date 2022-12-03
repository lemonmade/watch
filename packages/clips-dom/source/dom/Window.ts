import {Document} from './Document';
import {Event} from './Event';
import {EventTarget} from './EventTarget';
import {Node} from './Node';
import {ParentNode} from './ParentNode';
import {ChildNode} from './ChildNode';
import {Element} from './Element';
import {HTMLElement} from './HTMLElement';
import {SVGElement} from './SVGElement';
import {CharacterData} from './CharacterData';
import {Text} from './Text';
import {Comment} from './Comment';
import {DocumentFragment} from './DocumentFragment';
import {HTMLTemplateElement} from './HTMLTemplateElement';
import {CustomElementRegistryImplementation} from './CustomElementRegistry';

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
