import React, {useEffect} from 'react';

import {Router} from '@quilted/quilt';
import {Rating} from '@lemon/zest';

interface Props {}

export function App(_props: Props) {
  useEffect(() => {
    (async () => {
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
