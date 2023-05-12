import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Heading as HeadingName, HeadingElement} from '@watching/clips';

export const Heading = createRemoteComponent(HeadingElement, {
  element: HeadingName,
});
