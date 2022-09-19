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
  BlockStack,
  View,
  TextBlock,
  Section,
  Text,
  Menu,
  Form,
  TextField,
  Select,
  Action,
} from '@lemon/zest';

import type {
  ClipsExtensionApiVersion,
  JSON as GraphQlJSON,
} from '~/graphql/types';
import {useQuery, useMutation} from '~/shared/graphql';
import type {ArrayElement, ThenType} from '~/shared/types';

import {type Sandbox as ExtensionSandbox} from '../sandboxes';
import {useRenderSandbox, type RenderController} from '../render';
import {
  useLocalDevelopmentServerQuery,
  type LocalExtension,
} from '../local-development';

import clipsExtensionSettingsQuery, {
  type ClipExtensionSettingsQueryData,
} from './graphql/ClipExtensionSettingsQuery.graphql';
import updateClipsExtensionSettingsMutation, {
  type UpdateClipsExtensionSettingsMutationData,
} from './graphql/UpdateClipsExtensionSettingsMutation.graphql';
import {type InstalledClipExtensionFragmentData} from './graphql/InstalledClipExtensionFragment.graphql';
import uninstallClipsExtensionFromClipMutation from './graphql/UninstallClipsExtensionFromClipMutation.graphql';
import localClipQuery, {
  type LocalClipQueryData,
} from './graphql/LocalClipQuery.graphql';

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
    Omit<ApiForExtensionPoint<T>, 'extensionPoint' | 'version' | 'settings'>
  >;
  build?: LocalClipQueryData.App.ClipsExtension.Build;
  settings?: GraphQlJSON;
}

type NoInfer<T> = T & {[K in keyof T]: T[K]};

const COMPONENTS: ReactComponentsForRuntimeExtension<ExtensionPoint> = {
  Text,
  View,
  Action,
};

export function InstalledClip<T extends ExtensionPoint>({
  id,
  api,
  extension,
  version,
  settings,
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
      script={version.assets[0]!.source}
      settings={settings ?? undefined}
      extensionPoint={extensionPoint}
    />
  );
}

const DEFAULT_BUILD_STATE = {
  __typename: 'ExtensionBuildInProgress',
  id: '0',
  startedAt: new Date().toISOString(),
} as const;

export function LocalClip<T extends ExtensionPoint>({
  id,
  api,
  name,
  extensionPoint,
}: LocalExtension & Pick<Props<T>, 'api' | 'extensionPoint'>) {
  const buildState =
    useLocalDevelopmentServerQuery(localClipQuery, {
      variables: {id},
    })?.data?.app?.clipsExtension?.build ?? DEFAULT_BUILD_STATE;

  const assetRef = useRef<string>();

  if (
    assetRef.current == null &&
    buildState.__typename === 'ExtensionBuildSuccess'
  ) {
    assetRef.current = buildState.assets[0]?.source;
  }

  if (!assetRef.current) return null;

  return (
    <Clip
      id={id}
      key={id}
      api={api}
      name={name}
      version="unstable"
      script={assetRef.current}
      build={buildState}
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
  build,
  api,
  settings,
}: Props<T>) {
  const controller = useMemo(
    () => createController(COMPONENTS),
    [extensionPoint],
  );

  const [receiver, sandboxController] = useRenderSandbox({
    api: api(),
    components: COMPONENTS as any,
    extensionPoint,
    version: version as any,
    script,
    settings,
  });

  return build ? (
    <LocalClipFrame
      name={name}
      build={build}
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
  const uninstallClipsExtensionFromClip = useMutation(
    uninstallClipsExtensionFromClipMutation,
  );

  return (
    <ClipFrame
      {...rest}
      controller={controller}
      renderPopoverContent={() => (
        <InstalledClipSettings id={id} controller={controller} />
      )}
      renderPopoverActions={() => (
        <>
          <Action onPress={() => alert('App page not implemented yet!')}>
            View app
          </Action>
          <Action onPress={() => controller.restart()}>Restart</Action>
          <Action
            onPress={() => {
              uninstallClipsExtensionFromClip.mutate({id});
            }}
          >
            Uninstall
          </Action>
          <Action onPress={() => alert('Reporting not implemented yet!')}>
            Report an issue
          </Action>
        </>
      )}
    />
  );
}

function InstalledClipSettings({
  id,
  controller,
}: {
  id: string;
  controller: RenderController<any>;
}) {
  const {data, isFetching, refetch} = useQuery(clipsExtensionSettingsQuery, {
    variables: {id},
  });

  if (data?.clipsInstallation == null) {
    return (
      <Text>
        {isFetching ? 'Loading settings...' : 'Something went wrong!'}
      </Text>
    );
  }

  const {
    clipsInstallation: {
      settings,
      version: {translations, settings: schema},
    },
  } = data;

  return (
    <InstalledClipLoadedSettings
      id={id}
      settings={settings}
      translations={translations}
      schema={schema}
      onUpdate={(data) => {
        refetch();
        controller.internals.settings.update(
          JSON.parse(
            data.updateClipsExtensionInstallation.installation?.settings ??
              '{}',
          ),
        );
      }}
    />
  );
}

function InstalledClipLoadedSettings({
  id,
  translations,
  settings,
  schema,
  onUpdate,
}: Pick<
  ClipExtensionSettingsQueryData.ClipsInstallation.Version,
  'translations'
> &
  Pick<ClipExtensionSettingsQueryData.ClipsInstallation, 'id' | 'settings'> & {
    schema: ClipExtensionSettingsQueryData.ClipsInstallation.Version['settings'];
    onUpdate(data: UpdateClipsExtensionSettingsMutationData): void;
  }) {
  const updateClipsExtensionSettings = useMutation(
    updateClipsExtensionSettingsMutation,
    {onSuccess: onUpdate},
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
    settings,
    (settings) => {
      const parsed = {...JSON.parse(settings ?? '{}')};

      return schema.fields.reduce<Record<string, unknown>>(
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
      field: ClipExtensionSettingsQueryData.ClipsInstallation.Version.Settings.Fields_ClipsExtensionSettingsStringField.Label,
    ) => {
      switch (field.__typename) {
        case 'ClipsExtensionSettingsStringStatic': {
          return field.value;
        }
        case 'ClipsExtensionSettingsStringTranslation': {
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
    updateClipsExtensionSettings.mutate({
      id,
      settings: JSON.stringify(values),
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
      <BlockStack spacing>
        {schema.fields.map((field) => {
          switch (field.__typename) {
            case 'ClipsExtensionSettingsStringField': {
              return (
                <TextField
                  key={field.key}
                  label={translateLabel(field.label)}
                  {...propsForField(field.key)}
                />
              );
            }
            case 'ClipsExtensionSettingsNumberField': {
              return (
                <TextField
                  key={field.key}
                  label={translateLabel(field.label)}
                  {...propsForField(field.key)}
                />
              );
            }
            case 'ClipsExtensionSettingsOptionsField': {
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
        <Action onPress={handleSubmit}>Update</Action>
      </BlockStack>
    </Form>
  );
}

interface LocalClipFrameProps<T extends ExtensionPoint>
  extends Omit<
    ClipFrameProps<T>,
    'renderPopoverContent' | 'renderPopoverActions'
  > {
  build: LocalClipQueryData.App.ClipsExtension.Build;
}

function LocalClipFrame<T extends ExtensionPoint>({
  children,
  controller,
  build,
  ...rest
}: PropsWithChildren<LocalClipFrameProps<T>>) {
  const lastBuild = useRef(build);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [forcedHeight, setForcedHeight] = useState<number | undefined>();

  useEffect(() => {
    const last = lastBuild.current;
    lastBuild.current = build;

    if (last.__typename === build.__typename) {
      return;
    }

    switch (build.__typename) {
      case 'ExtensionBuildInProgress': {
        setForcedHeight(containerRef.current?.getBoundingClientRect().height);
        break;
      }
      case 'ExtensionBuildSuccess': {
        controller.restart();
        break;
      }
    }
  }, [build, controller]);

  useEffect(() => {
    return controller.on('render', () => {
      setForcedHeight(undefined);
    });
  }, [controller]);

  return (
    <ClipFrame<T>
      controller={controller}
      {...rest}
      renderPopoverContent={() => <LocalDevelopmentOverview build={build} />}
      renderPopoverActions={() => (
        <Action onPress={() => controller.restart()}>Restart</Action>
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
  build: LocalClipQueryData.App.ClipsExtension.Build;
}

function LocalDevelopmentOverview({build}: LocalDevelopmentOverviewProps) {
  return <Text>{JSON.stringify(build)}</Text>;
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
        <Action
          popover={
            <Popover>
              <Section padding>
                <ClipTimings controller={controller} />
              </Section>
              {additionalSectionContents && (
                <Section padding>{additionalSectionContents}</Section>
              )}
              {actionContents && <Menu>{actionContents}</Menu>}
            </Popover>
          }
        >
          {name}
        </Action>
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
  const sandboxTimings = controller.sandbox.timings.value;
  const timings = controller.timings.value;
  const scripts = useSandboxScripts(controller);

  return (
    <View>
      {sandboxTimings.start ? (
        <TextBlock>
          sandbox started: {new Date(sandboxTimings.start).toLocaleTimeString()}
          {sandboxTimings.loadEnd
            ? ` (finished in ${
                sandboxTimings.loadEnd - sandboxTimings.start
              }ms)`
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
    const abort = new AbortController();
    let activeIndex = 0;

    controller.on(
      'start',
      () => {
        activeIndex += 1;
      },
      {signal: abort.signal},
    );

    controller.on(
      'render',
      () => {
        loadScripts();
      },
      {signal: abort.signal},
    );

    if (controller.state === 'rendered') {
      loadScripts();
    }

    return () => {
      abort.abort();
      activeIndex += 1;
    };

    async function loadScripts() {
      const startIndex = activeIndex;

      const entries = await controller.sandbox.run(
        ({getResourceTimingEntries}) => getResourceTimingEntries(),
      );

      if (startIndex !== activeIndex) return;

      setScripts(entries);
    }
  }, [controller]);

  return scripts;
}
