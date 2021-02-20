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
import {Popover, PopoverSheet, Button, View, TextBlock} from '@lemon/zest';

import type {ClipsExtensionApiVersion} from 'graphql/types';
import {useRenderSandbox} from 'utilities/clips';
import type {RenderController} from 'utilities/clips';

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
    <ClipLocalDevelopment socketUrl={local} controller={sandboxController}>
      {content}
    </ClipLocalDevelopment>
  ) : (
    content
  );
}
/* eslint-enable react-hooks/exhaustive-deps */

function ClipLocalDevelopment({
  socketUrl,
  children,
  controller,
}: PropsWithChildren<{
  socketUrl: string;
  controller: RenderController;
}>) {
  const [timings, setTimings] = useState<RenderController['timings']>();
  const [compiling, setCompiling] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [forcedHeight, setForcedHeight] = useState<number | undefined>();

  useEffect(() => {
    const webSocket = createDevServerWebSocket({url: socketUrl});

    const doneWithDone = webSocket.on('done', (buildState) => {
      setCompiling(false);
      if (buildState.status === 'unchanged') return;
      controller.restart();
    });

    const doneWithCompiling = webSocket.on('compile', () => {
      setCompiling(true);
      setForcedHeight(containerRef.current?.getBoundingClientRect().height);
    });

    webSocket.start();

    return () => {
      doneWithDone();
      doneWithCompiling();
      webSocket.stop();
    };
  }, [socketUrl, controller]);

  useEffect(() => {
    return controller.on('render', () => {
      setForcedHeight(undefined);
      setTimings({...controller.timings});
    });
  }, [controller]);

  return (
    <View>
      <Popover>
        <Button>Local extension {compiling ? '(compiling)' : ''}</Button>
        <PopoverSheet>
          <LocalDevelopmentDetails timings={timings} />
        </PopoverSheet>
      </Popover>
      <div
        ref={containerRef}
        style={forcedHeight ? {minHeight: `${forcedHeight}px`} : undefined}
      >
        {children}
      </div>
    </View>
  );
}

function LocalDevelopmentDetails({
  timings,
}: {
  timings?: RenderController['timings'];
}) {
  if (timings == null) {
    return null;
  }

  return (
    <View>
      {timings.start ? (
        <TextBlock>
          sandbox started: {new Date(timings.start).toLocaleTimeString()}
          {timings.loadEnd
            ? ` (finished in ${timings.loadEnd - timings.start}ms)`
            : null}
        </TextBlock>
      ) : null}

      {timings.renderStart ? (
        <TextBlock>
          render started: {new Date(timings.renderStart).toLocaleTimeString()}
          {timings.renderEnd
            ? ` (finished in ${timings.renderEnd - timings.renderStart}ms)`
            : null}
        </TextBlock>
      ) : null}
    </View>
  );
}
