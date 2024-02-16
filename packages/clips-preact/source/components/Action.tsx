import {createRemoteComponent} from '@remote-dom/preact';
import {Action as ActionElement} from '@watching/clips/elements';

export const Action = createRemoteComponent('ui-action', ActionElement);
