import {type RemoteComponentType} from '@remote-ui/core';

export * from './components/components.ts';

type ComponentTypes = typeof import('./components/components.ts');

export type Components = {
  [Key in keyof ComponentTypes]: ComponentTypes[Key] extends RemoteComponentType<
    any,
    any,
    any
  >
    ? ComponentTypes[Key]
    : never;
};

export type CommonComponents = Pick<
  Components,
  // Typography
  | 'Text'
  | 'TextBlock'
  | 'Heading'

  // Media
  | 'Image'

  // Forms
  | 'TextField'

  // Interaction
  | 'Action'

  // Containers
  | 'View'
  | 'Section'
  | 'Footer'
  | 'Header'

  // Overlays
  | 'Modal'
  | 'Popover'

  // Layout
  | 'Stack'
  | 'BlockStack'
  | 'InlineStack'
  | 'Grid'
  | 'BlockGrid'
  | 'InlineGrid'
>;

export type AnyComponent = Components[keyof Components];
