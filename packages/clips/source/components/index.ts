import {type RemoteComponentType} from '@remote-ui/core';

export * from './components';

type ComponentTypes = typeof import('./components');

export type Components = {
  [Key in keyof ComponentTypes]: ComponentTypes[Key] extends RemoteComponentType<any>
    ? ComponentTypes[Key]
    : never;
};

export type CommonComponents = Pick<
  Components,
  | 'Action'
  | 'BlockStack'
  | 'Footer'
  | 'Header'
  | 'Heading'
  | 'Image'
  | 'InlineStack'
  | 'Modal'
  | 'Popover'
  | 'Section'
  | 'Text'
  | 'TextBlock'
  | 'TextField'
  | 'View'
>;

export type AnyComponent = Components[keyof Components];
