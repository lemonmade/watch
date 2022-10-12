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
> = ComponentType<ReactPropsFromRemoteComponentType<Type>> & {
  readonly type: Type;
};

// TODO: implement fragment props, like @remote-ui/react
export function createRemoteReactComponent<
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Props = {},
  AllowedChildren extends RemoteComponentType<string, any> | boolean = true,
>(
  ComponentType: Type | RemoteComponentType<Type, Props, AllowedChildren>,
): ReactComponentTypeFromRemoteComponentType<
  RemoteComponentType<Type, Props, AllowedChildren>
> {
  function Component(props: Props) {
    // @ts-expect-error we fake this component as being a "native" component.
    return <ComponentType {...props} />;
  }

  Component.type = ComponentType;
  Component.displayName = `Remote(${ComponentType})`;

  return Component as any;
}
