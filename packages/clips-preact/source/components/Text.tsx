import {createRemoteComponent} from '@remote-dom/preact';
import {Text as TextElement} from '@watching/clips/elements';

export const Text = createRemoteComponent('ui-text', TextElement);
