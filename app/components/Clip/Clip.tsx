import {useMemo, useEffect, useState, useRef} from 'react';
import type {PropsWithChildren} from 'react';
import type {IdentifierForRemoteComponent} from '@remote-ui/core';
import {createController, RemoteRenderer} from '@remote-ui/react/host';
import type {ReactComponentTypeFromRemoteComponentType} from '@remote-ui/react/host';
import type {
  AnyComponent,
  ExtensionPoint,
  ApiForExtensionPoint,
  AllowedComponentsForExtensionPoint,
} from '@watching/clips';
import {createDevServerWebSocket} from '@watching/webpack-hot-worker/websocket';
import type {EventMap} from '@watching/webpack-hot-worker/websocket';

import type {ClipsExtensionApiVersion} from 'graphql/types';
import {useRenderSandbox} from 'utilities/clips';
import type {RenderController} from 'utilities/clips';

import styles from './Clip.css';

type ReactComponentsForRuntimeExtension<T extends ExtensionPoint> = {
  [Identifier in IdentifierForRemoteComponent<
    AllowedComponentsForExtensionPoint<T>
  >]: ReactComponentTypeFromRemoteComponentType<
    Extract<AnyComponent, Identifier>
  >;
};

export interface Props<T extends ExtensionPoint> {
  extensionPoint: T;
  version: ClipsExtensionApiVersion;
  script: string;
  api: Omit<ApiForExtensionPoint<T>, 'extensionPoint' | 'version'>;
  components: ReactComponentsForRuntimeExtension<T>;
  local?: string;
}

/* eslint-disable react-hooks/exhaustive-deps */
export function Clip<T extends ExtensionPoint>({
  extensionPoint,
  version,
  script,
  local,
  api,
  components,
}: Props<T>) {
  const controller = useMemo(() => createController(components), [
    extensionPoint,
  ]);

  const [receiver, sandboxController] = useRenderSandbox({
    api,
    components,
    extensionPoint,
    version: version as any,
    script,
  });

  const content = (
    <RemoteRenderer controller={controller} receiver={receiver} />
  );

  return local ? (
    <ClipLocalDev socketUrl={local} controller={sandboxController}>
      {content}
    </ClipLocalDev>
  ) : (
    content
  );
}
/* eslint-enable react-hooks/exhaustive-deps */

function ClipLocalDev({
  socketUrl,
  children,
  controller,
}: PropsWithChildren<{
  socketUrl: string;
  controller: RenderController;
}>) {
  const [buildState, setBuildState] = useState<EventMap['done']>();
  const [compiling, setCompiling] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [forcedHeight, setForcedHeight] = useState<number | undefined>();

  useEffect(() => {
    const webSocket = createDevServerWebSocket({url: socketUrl});

    const doneWithDone = webSocket.on('done', (buildState) => {
      setCompiling(false);
      if (buildState.status === 'unchanged') return;
      setBuildState(buildState);
      controller.restart();
    });

    const doneWithConnect = webSocket.on('connect', (connectionState) => {
      if (connectionState.status === 'building') return;
      setBuildState(connectionState);
    });

    const doneWithCompiling = webSocket.on('compile', () => {
      setCompiling(true);
      setForcedHeight(containerRef.current?.getBoundingClientRect().height);
    });

    webSocket.start();

    return () => {
      doneWithDone();
      doneWithConnect();
      doneWithCompiling();
      webSocket.stop();
    };
  }, [socketUrl, controller]);

  useEffect(() => {
    return controller.on('render', () => {
      setForcedHeight(undefined);
    });
  }, [controller]);

  return (
    <div className={styles.LocalClip}>
      <p className={styles.LocalClipHeading}>
        Local extension ({compiling ? 'compiling... ' : ''}
        {JSON.stringify(buildState)})
      </p>
      <div
        ref={containerRef}
        style={forcedHeight ? {minHeight: `${forcedHeight}px`} : undefined}
      >
        {children}
      </div>
    </div>
  );
}
