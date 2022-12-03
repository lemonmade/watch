import {type Heading as BaseHeading} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Heading = 'ui-heading';
export type UIHeadingElement = HTMLElementForRemoteComponent<
  typeof BaseHeading
>;
