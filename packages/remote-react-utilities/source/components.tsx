import type {RemoteComponentType} from '@remote-ui/core';

import type {ReactComponentTypeFromRemoteComponentType} from './types';

// TODO: implement fragment props, like @remote-ui/react
export function createRemoteReactComponent<
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Props = {},
  AllowedChildren extends RemoteComponentType<string, any> | boolean = true,
>(
  componentType: Type | RemoteComponentType<Type, Props, AllowedChildren>,
): RemoteComponentType<Type, Props, AllowedChildren> &
  ReactComponentTypeFromRemoteComponentType<
    RemoteComponentType<Type, Props, AllowedChildren>
  > {
  return componentType as any;
}
