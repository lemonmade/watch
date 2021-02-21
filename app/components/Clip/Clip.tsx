import {useMemo, useEffect, useState, useRef} from 'react';
import type {PropsWithChildren, ReactNode} from 'react';
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
import {
  Popover,
  PopoverSheet,
  BlockStack,
  View,
  TextBlock,
  Section,
  Text,
  ActionMenu,
  Pressable,
} from '@lemon/zest';

import type {ClipsExtensionApiVersion} from 'graphql/types';
import {useRenderSandbox} from 'utilities/clips';
import type {RenderController, ExtensionSandbox} from 'utilities/clips';
import type {ArrayElement, ThenType} from 'utilities/types';

type ReactComponentsForRuntimeExtension<T extends ExtensionPoint> = {
  [Identifier in IdentifierForRemoteComponent<
    AllowedComponentsForExtensionPoint<T>
  >]: ReactComponentTypeFromRemoteComponentType<
    Extract<AnyComponent, Identifier>
  >;
};

export interface Props<T extends ExtensionPoint> {
  extensionPoint: T;
  name: string;
  version: ClipsExtensionApiVersion;
  script: string;
  api: Omit<ApiForExtensionPoint<T>, 'extensionPoint' | 'version'>;
  components: ReactComponentsForRuntimeExtension<T>;
  local?: string;
}

/* eslint-disable react-hooks/exhaustive-deps */
export function Clip<T extends ExtensionPoint>({
  name,
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

  return local ? (
    <LocalDevelopmentClip
      name={name}
      socketUrl={local}
      controller={sandboxController}
      script={script}
    >
      <RemoteRenderer controller={controller} receiver={receiver} />
    </LocalDevelopmentClip>
  ) : (
    <InstalledClip name={name} controller={sandboxController} script={script}>
      <RemoteRenderer controller={controller} receiver={receiver} />
    </InstalledClip>
  );
}
/* eslint-enable react-hooks/exhaustive-deps */

interface InstalledClipProps
  extends Omit<
    ClipFrameProps,
    'renderPopoverContent' | 'renderPopoverActions'
  > {}

function InstalledClip({
  controller,
  ...rest
}: PropsWithChildren<InstalledClipProps>) {
  return (
    <ClipFrame
      {...rest}
      controller={controller}
      renderPopoverActions={() => (
        <>
          <Pressable
            // eslint-disable-next-line no-alert
            onPress={() => alert('App page not implemented yet!')}
          >
            View app
          </Pressable>
          <Pressable onPress={() => controller.restart()}>Restart</Pressable>
          <Pressable
            // eslint-disable-next-line no-alert
            onPress={() => alert('Uninstall not implemented yet!')}
          >
            Uninstall
          </Pressable>
          <Pressable
            // eslint-disable-next-line no-alert
            onPress={() => alert('Reporting not implemented yet!')}
          >
            Report an issue
          </Pressable>
        </>
      )}
    />
  );
}

interface LocalDevelopmentClipProps
  extends Omit<
    ClipFrameProps,
    'renderPopoverContent' | 'renderPopoverActions'
  > {
  socketUrl: string;
}

type BuildState = EventMap['connect'];

function LocalDevelopmentClip({
  socketUrl,
  children,
  controller,
  ...rest
}: PropsWithChildren<LocalDevelopmentClipProps>) {
  const [compiling, setCompiling] = useState(false);
  const [buildState, setBuildState] = useState<BuildState | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [forcedHeight, setForcedHeight] = useState<number | undefined>();

  useEffect(() => {
    const webSocket = createDevServerWebSocket({url: socketUrl});

    const doneWithConnect = webSocket.on('connect', (buildState) => {
      setBuildState(buildState);
    });

    const doneWithDone = webSocket.on('done', (buildState) => {
      setCompiling(false);
      if (buildState.status === 'unchanged') return;
      setBuildState(buildState);
      controller.restart();
    });

    const doneWithCompiling = webSocket.on('compile', () => {
      setCompiling(true);
      setForcedHeight(containerRef.current?.getBoundingClientRect().height);
    });

    webSocket.start();

    return () => {
      doneWithConnect();
      doneWithDone();
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
    <ClipFrame
      controller={controller}
      {...rest}
      renderPopoverContent={() => (
        <LocalDevelopmentOverview
          compiling={compiling}
          buildState={buildState}
        />
      )}
      renderPopoverActions={() => (
        <Pressable onPress={() => controller.restart()}>Restart</Pressable>
      )}
    >
      <div
        ref={containerRef}
        style={forcedHeight ? {minHeight: `${forcedHeight}px`} : undefined}
      >
        {children}
      </div>
    </ClipFrame>
  );
}

interface LocalDevelopmentOverviewProps {
  compiling: boolean;
  buildState?: BuildState;
}

function LocalDevelopmentOverview({
  compiling,
  buildState,
}: LocalDevelopmentOverviewProps) {
  if (buildState == null) {
    return <Text>Connecting to local development server...</Text>;
  } else if (compiling) {
    return <Text>Compiling...</Text>;
  }

  return <Text>{JSON.stringify(buildState)}</Text>;
}

interface ClipFrameProps {
  name: string;
  script: string;
  controller: RenderController;
  renderPopoverContent?(): ReactNode;
  renderPopoverActions?(): ReactNode;
}

function ClipFrame({
  name,
  controller,
  children,
  renderPopoverContent,
  renderPopoverActions,
}: PropsWithChildren<ClipFrameProps>) {
  const additionalSectionContents = renderPopoverContent?.() ?? null;
  const actionContents = renderPopoverActions?.() ?? null;

  return (
    <BlockStack spacing="small">
      <View>
        <Popover>
          <Pressable>{name}</Pressable>
          <PopoverSheet>
            <Section>
              <ClipTimings controller={controller} />
            </Section>
            {additionalSectionContents && (
              <Section>{additionalSectionContents}</Section>
            )}
            {actionContents && <ActionMenu>{actionContents}</ActionMenu>}
          </PopoverSheet>
        </Popover>
      </View>
      <View>{children}</View>
    </BlockStack>
  );
}

interface ClipTimingsProps {
  controller: RenderController;
}

function ClipTimings({controller}: ClipTimingsProps) {
  const timings = useTimings(controller);
  const scripts = useSandboxScripts(controller);

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

      <View>
        {scripts.map((script) => (
          <DownloadedScript key={script.name} script={script} />
        ))}
      </View>
    </View>
  );
}

type Script = ArrayElement<
  ThenType<ReturnType<ExtensionSandbox['getResourceTimingEntries']>>
>;

// @see https://github.com/sindresorhus/pretty-bytes/blob/main/index.js
const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

function prettyBytes(bytes: number) {
  const exponent = Math.min(
    Math.floor(Math.log10(bytes) / 3),
    BYTE_UNITS.length - 1,
  );

  const normalized = bytes / 1000 ** exponent;

  return `${normalized.toLocaleString(undefined, {maximumFractionDigits: 2})} ${
    BYTE_UNITS[exponent]
  }`;
}

function DownloadedScript({
  script: {name, duration, encodedBodySize},
}: {
  script: Script;
}) {
  const sizePrefix = encodedBodySize
    ? `${prettyBytes(encodedBodySize)} `
    : null;
  return (
    <TextBlock>
      {name} ({sizePrefix}downloaded in{' '}
      {duration.toLocaleString(undefined, {maximumFractionDigits: 2})}ms)
    </TextBlock>
  );
}

function useSandboxScripts(controller: RenderController) {
  const [scripts, setScripts] = useState<Script[]>([]);

  useEffect(() => {
    let activeIndex = 0;

    const doneWithRestart = controller.on('start', () => {
      activeIndex += 1;
    });

    const doneWithRender = controller.on('render', () => {
      loadScripts();
    });

    if (controller.state === 'rendered') {
      loadScripts();
    }

    return () => {
      doneWithRestart();
      doneWithRender();
      activeIndex += 1;
    };

    async function loadScripts() {
      const startIndex = activeIndex;

      const entries = await controller.sandbox.getResourceTimingEntries();

      if (startIndex !== activeIndex) return;

      setScripts(entries);
    }
  }, [controller]);

  return scripts;
}

function useTimings(controller: RenderController) {
  const [state, setState] = useState<{
    id: RenderController['id'];
    timings: RenderController['timings'];
    controller: RenderController;
  }>(() => ({
    id: controller.id,
    timings: {...controller.timings},
    controller,
  }));

  let timings = state.timings;

  if (state.controller !== controller) {
    timings = {...controller.timings};
    setState({controller, timings, id: controller.id});
  }

  useEffect(() => {
    const checkForUpdates = () => {
      setState((currentState) => {
        if (currentState.id === controller.id) return currentState;

        return {
          controller,
          id: controller.id,
          timings: {...controller.timings},
        };
      });
    };

    checkForUpdates();

    return controller.on('render', () => checkForUpdates());
  }, [controller]);

  return timings;
}
