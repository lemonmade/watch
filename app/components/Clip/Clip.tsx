import {useMemo, useEffect, useState, useRef, useReducer} from 'react';
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
import {
  Popover,
  PopoverSheet,
  BlockStack,
  View,
  TextBlock,
  Section,
  Text,
  Menu,
  Form,
  TextField,
  Select,
  Button,
} from '@lemon/zest';
import {useQuery, useMutation} from '@quilted/quilt';

import type {
  ClipsExtensionApiVersion,
  JSON as GraphQlJSON,
} from 'graphql/types';
import {useRenderSandbox} from 'utilities/clips';
import type {
  RenderController,
  ExtensionSandbox,
  LocalExtension,
} from 'utilities/clips';
import type {ArrayElement, ThenType} from 'utilities/types';

import clipsExtensionConfigurationQuery from './graphql/ClipExtensionConfigurationQuery.graphql';
import type {ClipExtensionConfigurationQueryData} from './graphql/ClipExtensionConfigurationQuery.graphql';
import updateClipsExtensionConfigurationMutation from './graphql/UpdateClipsExtensionConfigurationMutation.graphql';
import type {InstalledClipExtensionFragmentData} from './graphql/InstalledClipExtensionFragment.graphql';

type ReactComponentsForRuntimeExtension<T extends ExtensionPoint> = {
  [Identifier in IdentifierForRemoteComponent<
    AllowedComponentsForExtensionPoint<T>
  >]: ReactComponentTypeFromRemoteComponentType<
    Extract<AnyComponent, Identifier>
  >;
};

export interface Props<T extends ExtensionPoint> {
  id: string;
  extensionPoint: T;
  name: string;
  version: ClipsExtensionApiVersion;
  script: string;
  api: () => NoInfer<
    Omit<
      ApiForExtensionPoint<T>,
      'extensionPoint' | 'version' | 'configuration'
    >
  >;
  local?: string;
  configuration?: GraphQlJSON;
}

type NoInfer<T> = T & {[K in keyof T]: T[K]};

const COMPONENTS: ReactComponentsForRuntimeExtension<ExtensionPoint> = {
  Text,
  View,
};

export function InstalledClip<T extends ExtensionPoint>({
  id,
  api,
  extension,
  version,
  configuration,
  extensionPoint,
}: InstalledClipExtensionFragmentData &
  Pick<Props<T>, 'api' | 'extensionPoint'>) {
  return (
    <Clip
      id={id}
      key={id}
      api={api}
      name={extension.name}
      version={version.apiVersion}
      script={version.assets[0].source}
      configuration={configuration ?? undefined}
      extensionPoint={extensionPoint}
    />
  );
}

export function LocalClip<T extends ExtensionPoint>({
  id,
  api,
  name,
  script,
  version,
  extensionPoint,
}: LocalExtension & Pick<Props<T>, 'api' | 'extensionPoint'>) {
  return (
    <Clip
      id={id}
      key={id}
      api={api}
      name={name}
      version={version}
      script={script}
      extensionPoint={extensionPoint}
    />
  );
}

/* eslint-disable react-hooks/exhaustive-deps */
export function Clip<T extends ExtensionPoint>({
  id,
  name,
  extensionPoint,
  version,
  script,
  local,
  api,
  configuration,
}: Props<T>) {
  const controller = useMemo(() => createController(COMPONENTS), [
    extensionPoint,
  ]);

  const [receiver, sandboxController] = useRenderSandbox({
    api: api(),
    components: COMPONENTS as any,
    extensionPoint,
    version: version as any,
    script,
    configuration,
  });

  useValueOnChange(configuration, () => {
    sandboxController.internals.configuration.update(
      JSON.parse(configuration ?? '{}'),
    );
  });

  return local ? (
    <LocalClipFrame
      name={name}
      socketUrl={local}
      controller={sandboxController}
      script={script}
    >
      <RemoteRenderer controller={controller} receiver={receiver} />
    </LocalClipFrame>
  ) : (
    <InstalledClipFrame
      id={id}
      name={name}
      controller={sandboxController}
      script={script}
    >
      <RemoteRenderer controller={controller} receiver={receiver} />
    </InstalledClipFrame>
  );
}
/* eslint-enable react-hooks/exhaustive-deps */

function useValueOnChange<T>(
  value: T,
  onChange: (value: T, lastValue: T) => void,
) {
  const internals = useRef<[T, typeof onChange]>([value, onChange]);

  useEffect(() => {
    const [lastValue, onChange] = internals.current;

    if (lastValue !== value) {
      internals.current[0] = value;
      onChange(value, lastValue);
    }
  }, [value]);
}

interface InstalledClipFrameProps<T extends ExtensionPoint>
  extends Omit<
    ClipFrameProps<T>,
    'renderPopoverContent' | 'renderPopoverActions'
  > {
  id: string;
}

function InstalledClipFrame<T extends ExtensionPoint>({
  controller,
  id,
  ...rest
}: PropsWithChildren<InstalledClipFrameProps<T>>) {
  return (
    <ClipFrame
      {...rest}
      controller={controller}
      renderPopoverContent={() => <InstalledClipConfiguration id={id} />}
      renderPopoverActions={() => (
        <>
          <Button
            // eslint-disable-next-line no-alert
            onPress={() => alert('App page not implemented yet!')}
          >
            View app
          </Button>
          <Button onPress={() => controller.restart()}>Restart</Button>
          <Button
            // eslint-disable-next-line no-alert
            onPress={() => alert('Uninstall not implemented yet!')}
          >
            Uninstall
          </Button>
          <Button
            // eslint-disable-next-line no-alert
            onPress={() => alert('Reporting not implemented yet!')}
          >
            Report an issue
          </Button>
        </>
      )}
    />
  );
}

function InstalledClipConfiguration({id}: {id: string}) {
  const {data, loading} = useQuery(clipsExtensionConfigurationQuery, {
    variables: {id},
  });

  if (data?.clipsInstallation == null) {
    return (
      <Text>
        {loading ? 'Loading configuration...' : 'Something went wrong!'}
      </Text>
    );
  }

  const {
    clipsInstallation: {
      configuration,
      version: {translations, configurationSchema},
    },
  } = data;

  return (
    <InstalledClipLoadedConfiguration
      id={id}
      configuration={configuration}
      translations={translations}
      configurationSchema={configurationSchema}
    />
  );
}

function InstalledClipLoadedConfiguration({
  id,
  configuration,
  translations,
  configurationSchema,
}: Pick<
  ClipExtensionConfigurationQueryData.ClipsInstallation.Version,
  'translations' | 'configurationSchema'
> &
  Pick<
    ClipExtensionConfigurationQueryData.ClipsInstallation,
    'id' | 'configuration'
  >) {
  const updateClipsExtensionConfiguration = useMutation(
    updateClipsExtensionConfigurationMutation,
  );

  const [values, dispatch] = useReducer(
    (
      state: Record<string, unknown>,
      action: {type: 'set'; field: string; value?: string},
    ) => {
      switch (action.type) {
        case 'set': {
          return {
            ...state,
            [action.field]: action.value,
          };
        }
      }

      return state;
    },
    configuration,
    (configuration) => {
      const parsed = {...JSON.parse(configuration ?? '{}')};

      return configurationSchema.reduce<Record<string, unknown>>(
        (normalized, field) =>
          'key' in field
            ? {
                ...normalized,
                [field.key]: parsed[field.key],
              }
            : normalized,
        {},
      );
    },
  );

  const translateLabel = useMemo(() => {
    const parsedTranslations = JSON.parse(translations ?? '{}');

    return (
      field: ClipExtensionConfigurationQueryData.ClipsInstallation.Version.ConfigurationSchema_ClipsExtensionNumberConfigurationField.Label,
    ) => {
      switch (field.__typename) {
        case 'ClipsExtensionConfigurationStringStatic': {
          return field.value;
        }
        case 'ClipsExtensionConfigurationStringTranslation': {
          const translated = parsedTranslations[field.key];
          if (translated == null) {
            throw new Error(`No translation found for ${field.key}`);
          }

          return translated;
        }
      }

      throw new Error(`Unknown type: ${field.__typename}`);
    };
  }, [translations]);

  const handleSubmit = () => {
    updateClipsExtensionConfiguration({
      variables: {id, configuration: JSON.stringify(values)},
    });
  };

  const propsForField = (field: string) => {
    return {
      value: values[field] ? String(values[field]) : undefined,
      onChange(value: string) {
        dispatch({type: 'set', field, value});
      },
    };
  };

  return (
    <Form onSubmit={handleSubmit}>
      <BlockStack>
        {configurationSchema.map((field) => {
          switch (field.__typename) {
            case 'ClipsExtensionStringConfigurationField': {
              return (
                <TextField
                  key={field.key}
                  label={translateLabel(field.label)}
                  {...propsForField(field.key)}
                />
              );
            }
            case 'ClipsExtensionNumberConfigurationField': {
              return (
                <TextField
                  key={field.key}
                  label={translateLabel(field.label)}
                  {...propsForField(field.key)}
                />
              );
            }
            case 'ClipsExtensionOptionsConfigurationField': {
              return (
                <Select
                  key={field.key}
                  label={translateLabel(field.label)}
                  options={field.options.map((option) => ({
                    value: option.value,
                    label: translateLabel(option.label),
                  }))}
                  {...propsForField(field.key)}
                />
              );
            }
          }

          throw new Error();
        })}
        <Button onPress={handleSubmit}>Update</Button>
      </BlockStack>
    </Form>
  );
}

interface LocalClipFrameProps<T extends ExtensionPoint>
  extends Omit<
    ClipFrameProps<T>,
    'renderPopoverContent' | 'renderPopoverActions'
  > {
  socketUrl: string;
}

interface EventMap {
  connect: {};
}

function createDevServerWebSocket(_arg: any) {
  return {} as {
    start(): void;
    stop(): void;
    on(event: string, func: (arg: any) => void): () => void;
  };
}

type BuildState = EventMap['connect'];

function LocalClipFrame<T extends ExtensionPoint>({
  socketUrl,
  children,
  controller,
  ...rest
}: PropsWithChildren<LocalClipFrameProps<T>>) {
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
    <ClipFrame<T>
      controller={controller}
      {...rest}
      renderPopoverContent={() => (
        <LocalDevelopmentOverview
          compiling={compiling}
          buildState={buildState}
        />
      )}
      renderPopoverActions={() => (
        <Button onPress={() => controller.restart()}>Restart</Button>
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

interface ClipFrameProps<T extends ExtensionPoint> {
  name: string;
  script: string;
  controller: RenderController<T>;
  renderPopoverContent?(): ReactNode;
  renderPopoverActions?(): ReactNode;
}

function ClipFrame<T extends ExtensionPoint>({
  name,
  controller,
  children,
  renderPopoverContent,
  renderPopoverActions,
}: PropsWithChildren<ClipFrameProps<T>>) {
  const additionalSectionContents = renderPopoverContent?.() ?? null;
  const actionContents = renderPopoverActions?.() ?? null;

  return (
    <BlockStack spacing="small">
      <View>
        <Popover>
          <Button>{name}</Button>
          <PopoverSheet>
            <Section padding={16}>
              <ClipTimings controller={controller} />
            </Section>
            {additionalSectionContents && (
              <Section padding={16}>{additionalSectionContents}</Section>
            )}
            {actionContents && <Menu>{actionContents}</Menu>}
          </PopoverSheet>
        </Popover>
      </View>
      <View>{children}</View>
    </BlockStack>
  );
}

interface ClipTimingsProps<T extends ExtensionPoint> {
  controller: RenderController<T>;
}

function ClipTimings<T extends ExtensionPoint>({
  controller,
}: ClipTimingsProps<T>) {
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

function useSandboxScripts(controller: RenderController<any>) {
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

function useTimings(controller: RenderController<any>) {
  const [state, setState] = useState<{
    id: RenderController<any>['id'];
    timings: RenderController<any>['timings'];
    controller: RenderController<any>;
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
