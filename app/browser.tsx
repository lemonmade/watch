import '@quilted/quilt/globals';
import {hydrateRoot} from 'react-dom/client';
import {createAsyncComponent} from '@quilted/quilt/async';

const App = createAsyncComponent(() => import('./App.tsx'));

const element = document.querySelector('#app')!;

hydrateRoot(element, <App />);
