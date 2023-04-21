import {useEffect} from 'react';
import {
  RemoteMutationObserver,
  createRemoteReceiver,
  RemoteRootElement,
  REMOTE_ID,
  REMOTE_CALLBACK,
  REMOTE_PROPERTIES,
  REMOTE_ROOT_ELEMENT_NAME,
  MUTATION_TYPE_UPDATE_PROPERTY,
  createRemoteMutationCallback,
} from '@lemon/remote-ui';

class UiButtonElement extends HTMLElement {
  static get observedAttributes() {
    return ['primary'];
  }
  private [REMOTE_PROPERTIES]: Record<string, unknown> = {};

  get primary() {
    return this[REMOTE_PROPERTIES].primary;
  }

  set primary(value) {
    this[REMOTE_PROPERTIES].primary = value;
    this[REMOTE_CALLBACK]?.([
      [MUTATION_TYPE_UPDATE_PROPERTY, this[REMOTE_ID], 'primary', value],
    ]);
  }

  attributeChangedCallback(key: string, _oldValue: any, newValue: any) {
    this[key] = newValue;
  }
}

customElements.define(REMOTE_ROOT_ELEMENT_NAME, RemoteRootElement);
customElements.define('ui-button', UiButtonElement);

declare global {
  interface HTMLElementTagNameMap {
    [REMOTE_ROOT_ELEMENT_NAME]: RemoteRootElement;
    'ui-button': UiButtonElement;
  }
}

export default function Playground() {
  useEffect(() => {
    const receiver = createRemoteReceiver();

    const observer = new RemoteMutationObserver(receiver.receive);

    receiver.subscribe(receiver.root, (root) => {
      console.log(performance.now());
      console.log(JSON.stringify(root.children, null, 2));
    });

    const element = document.createElement(REMOTE_ROOT_ELEMENT_NAME);
    element[REMOTE_CALLBACK] = receiver.receive;

    observer.observe(element);

    element.innerHTML = '<span>Hello1</span>';
    element.innerHTML =
      '<span>Hello2</span><span>Hello3</span><ui-button primary=""></ui-button>';

    setTimeout(() => {
      element.children[2]?.setAttribute('primary', 'two');
    }, 20);

    console.log(performance.now(), element.outerHTML);

    // debugger;
  }, []);

  return null;
}
