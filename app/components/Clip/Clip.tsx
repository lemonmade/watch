import {useMemo, useEffect, useState} from 'react';
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
import {createWorkerFactory, expose} from '@remote-ui/web-workers';
import type {ClipsExtensionApiVersion} from 'graphql/types';

import styles from './Clip.css';

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
  version: ClipsExtensionApiVersion;
  script: string;
  api: Omit<ApiForExtensionPoint<T>, 'extensionPoint' | 'version'>;
  components: ReactComponentsForRuntimeExtension<T>;
  local?: boolean;
}

export function Clip<T extends ExtensionPoint>({
  extensionPoint,
  version,
  script,
  ...rest
}: Props<T>) {
  const [key, refreshExtension] = useExtensionKey({
    extensionPoint,
    version,
    script,
  });

  return (
    <ClipInternal
      key={key}
      extensionPoint={extensionPoint}
      version={version}
      script={script}
      {...rest}
      onReload={refreshExtension}
    />
  );
}

function useExtensionKey<T extends ExtensionPoint>({
  extensionPoint,
  version,
  script,
}: Pick<Props<T>, 'extensionPoint' | 'version' | 'script'>): [
  string,
  () => void,
] {
  const [reloadId, setReloadId] = useState(0);

  return [
    `${extensionPoint}_${version}_${script}_${reloadId}`,
    () => setReloadId((id) => id + 1),
  ];
}

interface InternalProps<T extends ExtensionPoint> extends Props<T> {
  onReload?(): void;
}

/* eslint-disable react-hooks/exhaustive-deps */
function ClipInternal<T extends ExtensionPoint>({
  extensionPoint,
  version,
  script,
  api,
  components,
  onReload,
  local = false,
}: InternalProps<T>) {
  const sandbox = useWorker(createSandbox);

  const {controller, receiver} = useMemo(
    () => ({
      receiver: new RemoteReceiver(),
      controller: createController(components),
    }),
    [],
  );

  useEffect(() => {
    expose(sandbox, {
      reload() {
        onReload?.();
      },
    });

    (async () => {
      await sandbox.load(script);
      await sandbox.render(
        extensionPoint,
        receiver.receive,
        Object.keys(components),
        {...api, version, extensionPoint} as any,
      );
    })();
  }, [sandbox]);

  const content = (
    <RemoteRenderer controller={controller} receiver={receiver} />
  );

  return local ? (
    <div className={styles.LocalClip}>
      <p className={styles.LocalClipHeading}>Local extension</p>
      {content}
    </div>
  ) : (
    content
  );
}
/* eslint-enable react-hooks/exhaustive-deps */
