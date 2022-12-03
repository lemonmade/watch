import {
  type RemoteComponentType,
  type PropsForRemoteComponent,
} from '@remote-ui/core';

export type HTMLElementForRemoteComponent<
  Type extends RemoteComponentType<any, any, any>,
> = HTMLElement & PropsForRemoteComponent<Type>;

export interface HTMLConstructorForRemoteComponent<
  Type extends RemoteComponentType<any, any, any>,
> {
  readonly remote: Type;
  new (): HTMLElementForRemoteComponent<Type>;
}
