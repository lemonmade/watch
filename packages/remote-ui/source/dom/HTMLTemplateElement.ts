import {CONTENT} from './constants.ts';
import {DocumentFragment} from './DocumentFragment.ts';
import {Element} from './Element.ts';
import {parseHtml, serializeChildren} from './serialization.ts';

export class HTMLTemplateElement extends Element {
  [CONTENT]?: DocumentFragment;

  get content() {
    let content = this[CONTENT];
    if (!content) {
      content = new DocumentFragment();
      this[CONTENT] = content;
    }
    return content;
  }

  set content(_) {}

  set innerHTML(html) {
    this.content.replaceChildren(parseHtml(String(html), this));
  }

  get innerHTML() {
    const content = this[CONTENT];
    return content ? serializeChildren(content) : '';
    // return Element.prototype.innerHTML.call(this.content);
  }
}
