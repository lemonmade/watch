import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Section as SectionName, SectionElement} from '@watching/clips';

export const Section = createRemoteComponent(SectionElement, {
  element: SectionName,
});
