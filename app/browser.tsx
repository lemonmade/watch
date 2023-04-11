import '@quilted/quilt/global';
import {hydrateRoot} from 'react-dom/client';
import {createAsyncComponent} from '@quilted/quilt';

const App = createAsyncComponent(() => import('./App.tsx'));

const element = document.querySelector('#app')!;

hydrateRoot(element, <App />);