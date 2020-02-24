import React from 'react';
import {render} from 'react-dom';
import {createWorkerComponent, Router} from '@quilted/quilt';

import * as components from './ui';

import '@lemon/zest/core.css';
import './App.css';

const App = createWorkerComponent(() => import('./App'), {
  components,
});

render(
  <Router>
    <App />
  </Router>,
  document.querySelector('#app'),
);
