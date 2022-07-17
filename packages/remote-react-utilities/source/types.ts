import type {ReactNode, ComponentType, ReactElement} from 'react';
import type {RemoteComponentType, RemoteFragment} from '@remote-ui/core';

export type ReactPropsFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = (Type extends RemoteComponentType<string, infer Props, any>
  ? Props extends Record<string, never>
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        [K in keyof Props]: Props[K] extends RemoteFragment<infer R>
          ? ReactElement | false | RemoteFragment<R>
          : Props[K];
      }
  : never) & {
  children?: ReactNode;
};

export type ReactComponentTypeFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = ComponentType<ReactPropsFromRemoteComponentType<Type>>;
