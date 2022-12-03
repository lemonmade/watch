import {type Text as BaseText} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Text = 'ui-text';
export type UITextElement = HTMLElementForRemoteComponent<typeof BaseText>;
