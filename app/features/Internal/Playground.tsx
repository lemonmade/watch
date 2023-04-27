import {useEffect} from 'react';
import {
  // RemoteMutationObserver,
  createRemoteReceiver,
  RemoteElement,
  RemoteRootElement,
  RemoteMutationCallback,
} from '@lemon/remote-ui';

import {
  createThread,
  targetFromWebWorker,
  createThreadWorker,
} from '@quilted/quilt/threads';

// class UiButtonElement extends RemoteElement {
//   static properties = {
//     primary: {attribute: true},
//   };
// }

// customElements.define('remote-root', RemoteRootElement);
// customElements.define('ui-button', UiButtonElement);

const createWorker = createThreadWorker(() => import('./worker.ts'));

export default function Playground() {
  useEffect(() => {
    const receiver = createRemoteReceiver();

    const worker = createWorker({});

    console.log('MESSAGING');
    worker.render(receiver.receive);
    window.receiver = receiver;
    return;

    receiver.subscribe(receiver.root, (root) => {
      console.log(performance.now());
      console.log(JSON.stringify(root.children, null, 2));
    });

    const element = document.createElement('remote-root');

    element.connect(receiver.receive);
    const observer = new RemoteMutationObserver(receiver.receive);
    observer.observe(element);

    element.innerHTML = '<span>Hello1</span>';
    element.innerHTML =
      '<span>Hello2</span><span>Hello3</span><ui-button primary=""></ui-button>';

    setTimeout(() => {
      element.children[2]?.setAttribute('primary', 'two');
      element.children[2]?.append('Hello4');
      element.appendChild(document.createElement('span'));
      // element.connect(receiver.receive);
    }, 20);

    console.log(performance.now(), element.outerHTML);

    // debugger;
  }, []);

  return null;
}
