import {type ReactNode} from 'react';
import {type Components} from '@watching/clips';
import {type ThreadSignal, type Signal} from '@watching/thread-signals';
import {type RemoteComponentType, type RemoteFragment} from '@remote-ui/core';

export type PropsForClipsComponent<Component extends keyof Components> =
  ReactPropsFromRemoteComponentType<Components[Component]>;

type PropsForRemoteComponent<T> = T extends RemoteComponentType<
  string,
  infer Props,
  any
>
  ? Props extends Record<string, never>
    ? {}
    : {
        [K in keyof Props]: RemotePropToHostProp<Exclude<Props[K], undefined>>;
      }
  : never;

type RemotePropToHostProp<T> = T extends ThreadSignal<infer R>
  ? Signal<R>
  : T extends RemoteFragment<any>
  ? ReactNode
  : T;

export type ReactPropsFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = PropsForRemoteComponent<Type> & {
  children?: ReactNode;
};
