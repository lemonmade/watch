import '@lemon/remote-ui/polyfill';

import {
  RemoteElement,
  RemoteRootElement,
  type RemoteMutationCallback,
} from '@lemon/remote-ui';

class UiButtonElement extends RemoteElement {
  static properties = {
    primary: {attribute: true},
  };
}

customElements.define('remote-root', RemoteRootElement);
customElements.define('ui-button', UiButtonElement);

export function render(callback: RemoteMutationCallback) {
  const root = document.createElement('remote-root');
  root.connect(callback);
  console.log(root);
  root.innerHTML = '<ui-button primary>Click me</ui-button>';
}
