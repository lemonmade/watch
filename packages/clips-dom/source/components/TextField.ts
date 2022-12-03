import {type TextField as BaseTextField} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const TextField = 'ui-textField';
export type UITextFieldElement = HTMLElementForRemoteComponent<
  typeof BaseTextField
>;
