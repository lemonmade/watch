import {type Image as BaseImage} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Image = 'ui-image';
export type UIImageElement = HTMLElementForRemoteComponent<typeof BaseImage>;
