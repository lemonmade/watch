import '@lemonmade/remote-ui/polyfill';

import {
  type RemoteElement,
  type RemoteElementConstructor,
} from '@lemonmade/remote-ui/elements';

export * from './elements/elements.ts';

export type AnyElement = Extract<keyof HTMLElementTagNameMap, `ui-${string}`>;

export type Elements = Pick<HTMLElementTagNameMap, AnyElement>;

export type ElementConstructors = {
  [Key in keyof Elements]: Elements[Key] extends RemoteElement<
    infer Properties,
    infer Slots
  >
    ? RemoteElementConstructor<Properties, Slots>
    : never;
};

export type CommonElements = Pick<
  Elements,
  // Typography
  | 'ui-text'
  | 'ui-text-block'
  | 'ui-heading'

  // Media
  | 'ui-image'

  // Forms
  | 'ui-text-field'

  // Interaction
  | 'ui-action'

  // Containers
  | 'ui-view'
  | 'ui-section'
  | 'ui-footer'
  | 'ui-header'

  // Overlays
  | 'ui-modal'
  | 'ui-popover'

  // Layout
  | 'ui-stack'
  | 'ui-block-stack'
  | 'ui-inline-stack'
  | 'ui-grid'
  | 'ui-block-grid'
  | 'ui-inline-grid'
>;
