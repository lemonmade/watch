import '@lemonmade/remote-ui/polyfill';

import {
  type RemoteElement,
  type RemoteElementConstructor,
} from '@lemonmade/remote-ui/elements';

export {html} from '@lemonmade/remote-ui/html';

export * from './elements/elements.ts';

export type AnyElement = Extract<keyof HTMLElementTagNameMap, `ui-${string}`>;

export type Elements = Pick<HTMLElementTagNameMap, AnyElement>;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Elements {
  export type Text = HTMLElementTagNameMap['ui-text'];
  export type TextBlock = HTMLElementTagNameMap['ui-text-block'];
  export type Heading = HTMLElementTagNameMap['ui-heading'];

  export type Image = HTMLElementTagNameMap['ui-image'];

  export type TextField = HTMLElementTagNameMap['ui-text-field'];

  export type Action = HTMLElementTagNameMap['ui-action'];
  export type Disclosure = HTMLElementTagNameMap['ui-disclosure'];

  export type View = HTMLElementTagNameMap['ui-view'];
  export type Section = HTMLElementTagNameMap['ui-section'];
  export type Footer = HTMLElementTagNameMap['ui-footer'];
  export type Header = HTMLElementTagNameMap['ui-header'];

  export type Modal = HTMLElementTagNameMap['ui-modal'];
  export type Popover = HTMLElementTagNameMap['ui-popover'];

  export type Stack = HTMLElementTagNameMap['ui-stack'];
  export type BlockStack = HTMLElementTagNameMap['ui-block-stack'];
  export type InlineStack = HTMLElementTagNameMap['ui-inline-stack'];
  export type Grid = HTMLElementTagNameMap['ui-grid'];
  export type BlockGrid = HTMLElementTagNameMap['ui-block-grid'];
  export type InlineGrid = HTMLElementTagNameMap['ui-inline-grid'];
}

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
  | 'ui-disclosure'

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
