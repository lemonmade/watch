import {Image as BaseImage} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';

export const Image = 'ui-image';

export const ImageComponent = createRemoteDOMComponent(BaseImage, {
  properties: [
    'accessibilityRole',
    'aspectRatio',
    'description',
    'fit',
    'loading',
    'source',
    'sources',
  ],
});

export type UIImageElement = HTMLElementForRemoteComponent<typeof BaseImage>;
