import React from 'react';
import {Router} from '@quilted/quilt';

import {Ui, App} from './foundation';

interface Props {}

export function Watch(_props: Props) {
  return (
    <Router>
      <Ui>
        <App />
      </Ui>
    </Router>
  );
}
