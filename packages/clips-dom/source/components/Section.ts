import {type Section as BaseSection} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Section = 'ui-section';
export type UISectionElement = HTMLElementForRemoteComponent<
  typeof BaseSection
>;
