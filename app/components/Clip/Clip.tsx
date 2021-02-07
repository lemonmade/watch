import {useMemo, useEffect} from 'react';
import type {IdentifierForRemoteComponent} from '@remote-ui/core';
import {
  useWorker,
  createController,
  RemoteRenderer,
  RemoteReceiver,
} from '@remote-ui/react/host';
import type {ReactComponentTypeFromRemoteComponentType} from '@remote-ui/react/host';
import type {
  AnyComponent,
  ExtensionPoint,
  ApiForExtensionPoint,
  AllowedComponentsForExtensionPoint,
} from '@watching/clips';
import {createWorkerFactory} from '@remote-ui/web-workers';

export const createSandbox = createWorkerFactory(() =>
  import(/* webpackChunkName: 'ExtensionSandbox' */ './sandbox'),
);

type ReactComponentsForRuntimeExtension<T extends ExtensionPoint> = {
  [Identifier in IdentifierForRemoteComponent<
    AllowedComponentsForExtensionPoint<T>
  >]: ReactComponentTypeFromRemoteComponentType<
    Extract<AnyComponent, Identifier>
  >;
};

interface Props<T extends ExtensionPoint> {
  extensionPoint: T;
  script: string;
  api: ApiForExtensionPoint<T>;
  components: ReactComponentsForRuntimeExtension<T>;
}

export function Clip<T extends ExtensionPoint>({
  extensionPoint,
  script,
  api,
  components,
}: Props<T>) {
  const {controller, receiver} = useMemo(
    () => ({
      receiver: new RemoteReceiver(),
      controller: createController(components),
    }),
    // eslint-disable-next-line no-warning-comments
    // TODO: need to make this work properly if props change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const sandbox = useWorker(createSandbox);

  useEffect(() => {
    (async () => {
      await sandbox.load(script);
      await sandbox.render(
        extensionPoint,
        receiver.receive,
        Object.keys(components),
        api as any,
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandbox, extensionPoint]);

  return <RemoteRenderer controller={controller} receiver={receiver} />;
}
