import {createRemoteComponent} from '@remote-dom/preact';
import {View as ViewElement} from '@watching/clips/elements';

export const View = createRemoteComponent('ui-view', ViewElement);
