import {
  useMemo,
  useEffect,
  useState,
  useRef,
  useReducer,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {createThreadAbortSignal} from '@quilted/quilt/threads';
import type {
  RemoteComponentType,
  IdentifierForRemoteComponent,
} from '@remote-ui/core';
import {createController, RemoteRenderer} from '@remote-ui/react/host';
import type {
  ReactPropsFromRemoteComponentType,
  ReactComponentTypeFromRemoteComponentType,
} from '@remote-ui/react/host';
import type {
  Components,
  ExtensionPoint,
  ApiForExtensionPoint,
  AllowedComponentsForExtensionPoint,
} from '@watching/clips';
import {
  isThreadSignal,
  signal,
  type Signal,
  type ThreadSignal,
} from '@watching/thread-signals';
import {
  Popover,
  BlockStack,
  InlineStack,
  View,
  Section,
  Text,
  Menu,
  Form,
  TextField,
  Select,
  Action,
  ContentAction,
  Layout,
  Icon,
} from '@lemon/zest';

import type {
  ClipsExtensionApiVersion,
  JSON as GraphQlJSON,
} from '~/graphql/types';
import {useQuery, useMutation} from '~/shared/graphql';

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

import styles from './Clip.module.css';

type ReactComponentsForRuntimeExtension<T extends ExtensionPoint> = {
  [Identifier in IdentifierForRemoteComponent<
    AllowedComponentsForExtensionPoint<T>
  >]: Identifier extends keyof Components
    ? Components[Identifier] extends RemoteComponentType<any, any>
      ? ReactComponentTypeFromRemoteComponentType<Components[Identifier]>
      : never
    : never;
};

type PropsForClipsComponent<Component extends keyof Components> =
  ReactPropsFromRemoteComponentType<Components[Component]>;

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
  app?: InstalledClipExtensionFragmentData.Extension['app'];
  settings?: GraphQlJSON;
}

type NoInfer<T> = T & {[K in keyof T]: T[K]};

function ClipsAction({
  to,
  disabled,
  onPress,
  children,
}: PropsForClipsComponent<'Action'>) {
  const signalProps = usePossibleThreadSignals({disabled});

  return (
    <Action {...signalProps} to={to} onPress={onPress}>
      {children}
    </Action>
  );
}

function ClipsTextField({label, value}: PropsForClipsComponent<'TextField'>) {
  const signalProps = usePossibleThreadSignals({value});
  return <TextField {...signalProps} label={label} changeTiming="input" />;
}

function usePossibleThreadSignals<T extends Record<string, any>>(values: T): T {
  const internals = useRef<{
    signals: WeakMap<
      ThreadSignal<unknown>,
      {
        signal: Signal<unknown>;
        abort: AbortController;
        started: boolean;
        set(value: unknown): void;
      }
    >;
    active: Set<ThreadSignal<unknown>>;
  }>();

  internals.current ??= {
    signals: new WeakMap(),
    active: new Set(),
  };

  internals.current.active.clear();

  const newValues: Record<string, any> = {};

  for (const [key, value] of Object.entries(values)) {
    if (isThreadSignal(value)) {
      let signalDetails = internals.current.signals.get(value);

      if (signalDetails == null) {
        const resolvedSignal = signal(value.initial);

        const valueDescriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(resolvedSignal),
          'value',
        )!;

        Object.defineProperty(resolvedSignal, 'value', {
          ...valueDescriptor,
          get() {
            return valueDescriptor.get?.call(this);
          },
          set(updatedValue) {
            if (value.set == null) {
              throw new Error(
                `You can’t set the value of a readonly thread signal.`,
              );
            }

            value.set(updatedValue);
            return valueDescriptor.set?.call(this, updatedValue);
          },
        });

        signalDetails = {
          signal: resolvedSignal,
          abort: new AbortController(),
          started: false,
          set(value) {
            valueDescriptor.set?.call(resolvedSignal, value);
          },
        };

        internals.current.signals.set(value, signalDetails);
      }

      internals.current.active.add(value);
      newValues[key] = signalDetails.signal;
      continue;
    }

    newValues[key] = value;
  }

  const threadSignals = [...internals.current.active];

  useEffect(() => {
    const {signals, active} = internals.current!;

    for (const threadSignal of threadSignals) {
      const signalDetails = signals.get(threadSignal);

      if (signalDetails == null || signalDetails.started) continue;

      signalDetails.started = true;

      const threadAbortSignal = createThreadAbortSignal(
        signalDetails.abort.signal,
      );

      Promise.resolve(
        threadSignal.start(signalDetails.set, {signal: threadAbortSignal}),
      ).then(signalDetails.set);
    }

    return () => {
      for (const threadSignal of threadSignals) {
        if (active.has(threadSignal)) continue;
        signals.get(threadSignal)?.abort.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, threadSignals);

  return newValues as T;
}

const COMPONENTS: ReactComponentsForRuntimeExtension<ExtensionPoint> = {
  View,
  Action: ClipsAction,
  BlockStack,
  InlineStack,
  Text,
  TextField: ClipsTextField,
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
      app={extension.app}
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
  app,
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
      app={app}
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
      app={app}
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
          <Action
            icon="arrowEnd"
            onPress={() => alert('App page not implemented yet!')}
          >
            View app
          </Action>
          <Action icon="sync" onPress={() => controller.restart()}>
            Restart
          </Action>
          <Action
            icon="delete"
            onPress={async () => {
              await uninstallClipsExtensionFromClip.mutateAsync({id});
            }}
          >
            Uninstall
          </Action>
          <Action
            icon="message"
            onPress={() => alert('Reporting not implemented yet!')}
          >
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
      renderPopoverActions={() => (
        <>
          <Action icon="sync" onPress={() => controller.restart()}>
            Restart
          </Action>
        </>
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

interface ClipFrameProps<T extends ExtensionPoint> {
  name: string;
  app?: InstalledClipExtensionFragmentData.Extension['app'];
  script: string;
  controller: RenderController<T>;
  renderPopoverContent?(): ReactNode;
  renderPopoverActions?(): ReactNode;
}

function ClipFrame<T extends ExtensionPoint>({
  name,
  app,
  children,
  renderPopoverContent,
  renderPopoverActions,
}: PropsWithChildren<ClipFrameProps<T>>) {
  const additionalSectionContents = renderPopoverContent?.() ?? null;
  const actionContents = renderPopoverActions?.() ?? null;

  return (
    <BlockStack spacing="small">
      <ContentAction
        popover={
          <Popover inlineAttachment="start">
            {additionalSectionContents && (
              <Section padding>{additionalSectionContents}</Section>
            )}
            {actionContents && <Menu>{actionContents}</Menu>}
          </Popover>
        }
      >
        <Layout columns={['auto', 'fill']} spacing="small">
          <View
            display="inlineFlex"
            background="emphasized"
            border="subdued"
            cornerRadius
            inlineAlignment="center"
            className={styles.AppIcon}
          >
            <Icon source="app" />
          </View>
          <BlockStack>
            <Text emphasis>{name}</Text>
            {app == null ? (
              <Text emphasis="subdued" size="small">
                from <Text emphasis>local app</Text>
              </Text>
            ) : (
              <Text emphasis="subdued" size="small">
                from app <Text emphasis>{app.name}</Text>
              </Text>
            )}
          </BlockStack>
        </Layout>
      </ContentAction>

      <View>{children}</View>
    </BlockStack>
  );
}
