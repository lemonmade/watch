import type {ReactNode} from 'react';

import type {RemoteRoot, RemoteComponent} from '@remote-ui/core';
import {render as renderRemoteUi} from '@watching/remote-react/render';

export function render(
  child: ReactNode,
  remoteNode: RemoteRoot<any, any> | RemoteComponent<any, any>,
  callback?: () => void,
) {
  return renderRemoteUi(child, remoteNode, callback);
}
