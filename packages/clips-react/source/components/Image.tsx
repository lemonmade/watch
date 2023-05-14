import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Image as ImageName, ImageElement} from '@watching/clips';

export const Image = createRemoteComponent(ImageElement, {
  element: ImageName,
});
