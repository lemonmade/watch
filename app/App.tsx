import React, {useEffect} from 'react';

import {Router, createWorkerFactory} from '@quilted/quilt';
import {Rating} from '@lemon/zest';

interface Props {}

const createWorker = createWorkerFactory(() => import('./worker'));

export function App(_props: Props) {
  useEffect(() => {
    (async () => {
      const worker = createWorker();

      // eslint-disable-next-line no-console
      console.log(await worker.hello());

      const fetched = await fetch('http://localhost:8080/api', {
        method: 'POST',
        headers: {Accept: 'application/json'},
      });

      // eslint-disable-next-line no-console
      console.log(await fetched.json());
    })();
  });

  return (
    <Router>
      <div>Hello world!</div>
      <Rating />
    </Router>
  );
}
