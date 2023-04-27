import '@lemon/remote-ui/polyfill';

import {retain} from '@quilted/quilt/threads';

import {
  RemoteElement,
  RemoteRootElement,
  type RemoteMutationCallback,
} from '@lemon/remote-ui';

class UiButtonElement extends RemoteElement {
  static properties = {
    primary: {attribute: true},
    onPress: {attribute: true},
  };
}

customElements.define('remote-root', RemoteRootElement);
customElements.define('ui-button', UiButtonElement);

export function render(callback: RemoteMutationCallback) {
  retain(callback);

  const root = document.createElement('remote-root');
  root.connect(callback);
  console.log(root);
  let index = 0;
  root.innerHTML = `<ui-button primary>Click me ${index}</ui-button>`;
  root.children[0]!.onPress = () => {
    root.children[0].textContent = `Click me ${++index}`;
  };
}
