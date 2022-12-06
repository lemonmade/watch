import {Section as BaseSection} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';
import {VIEW_PROPERTIES} from './View';

export const Section = 'ui-section';

export const SectionComponent = createRemoteDOMComponent(BaseSection, {
  properties: VIEW_PROPERTIES,
});

export type UISectionElement = HTMLElementForRemoteComponent<
  typeof BaseSection
>;