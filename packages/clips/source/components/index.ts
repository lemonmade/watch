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
  'Action' | 'BlockStack' | 'InlineStack' | 'Text' | 'TextField' | 'View'
>;

export type AnyComponent = Components[keyof Components];
