import {useEffect, useMemo, useRef} from 'react';
import {useSignal, useSignalEffect} from '@quilted/quilt';
import {type ExtensionPoint} from '@watching/clips';
import {RemoteRenderer, createController} from '@remote-ui/react/host';
import {
  Popover,
  BlockStack,
  View,
  Text,
  Menu,
  ContentAction,
  Layout,
  Icon,
  Action,
  raw,
  Section,
} from '@lemon/zest';

import {useMutation} from '~/shared/graphql';

import {useClipsManager, useLocalDevelopmentServerQuerySignal} from '../react';
import {
  type ClipsExtensionPoint,
  type ClipsExtensionPointWithLocal,
  type ClipsExtensionPointInstance,
  type InstalledClipsExtensionPoint,
  type LocalClipsExtensionPoint,
} from '../extension';
import {
  type ExtensionPointWithOptions,
  type OptionsForExtensionPoint,
} from '../extension-points';

import {ClipSettings} from './ClipSettings';
import uninstallClipsExtensionFromClipMutation from './graphql/UninstallClipsExtensionFromClipMutation.graphql';
import localClipQuery, {
  type LocalClipQueryData,
} from './graphql/LocalClipQuery.graphql';

type OptionProps<Point extends ExtensionPoint> =
  Point extends ExtensionPointWithOptions
    ? {options: OptionsForExtensionPoint<Point>}
    : {options?: never};

export type ClipProps<Point extends ExtensionPoint> = {
  extension: ClipsExtensionPoint<Point>;
} & OptionProps<Point>;

export function Clip<Point extends ExtensionPoint>({
  extension,
  options,
}: ClipProps<Point>) {
  const installed = useInstalledClipInstance(
    extension,
    extension.installed,
    options as OptionsForExtensionPoint<Point>,
  );

  if (extension.local) {
    return (
      <ClipRendererWithLocalVersion
        extension={extension as ClipsExtensionPointWithLocal<Point>}
        options={options as OptionsForExtensionPoint<Point>}
        installed={installed}
      />
    );
  }

  return <ClipRenderer extension={extension} installed={installed} />;
}

function ClipRenderer<Point extends ExtensionPoint>({
  local,
  installed,
  extension,
}: {
  extension: ClipsExtensionPoint<Point>;
  local?: ClipsExtensionPointInstance<Point>;
  installed?: ClipsExtensionPointInstance<Point>;
}) {
  const {name, app} = extension.extension;

  const instance = local ?? installed;

  return (
    <BlockStack spacing="small">
      <ContentAction
        popover={
          <Popover inlineAttachment="start">
            {installed && (
              <Section padding>
                <ClipSettings instance={installed} />
              </Section>
            )}
            <Menu>
              <ViewAppAction />
              {instance && <RestartClipAction instance={instance} />}
              {extension.installed && (
                <UninstallClipAction
                  extension={extension}
                  installed={extension.installed}
                />
              )}
              {extension.installed && <ReportIssueAction />}
            </Menu>
          </Popover>
        }
      >
        <Layout columns={['auto', 'fill']} spacing="small">
          <View
            display="inlineFlex"
            background="emphasized"
            border="subdued"
            cornerRadius
            alignment="center"
            blockSize={raw`2.5rem`}
            inlineSize={raw`2.5rem`}
          >
            <Icon source="app" />
          </View>
          <BlockStack>
            <Text emphasis>{name}</Text>
            <Text emphasis="subdued" size="small">
              from app <Text emphasis>{app.name}</Text>
            </Text>
          </BlockStack>
        </Layout>
      </ContentAction>

      <View>{instance && <ClipInstanceRenderer instance={instance} />}</View>
    </BlockStack>
  );
}

function ClipRendererWithLocalVersion<Point extends ExtensionPoint>({
  options,
  extension,
  installed,
}: {
  extension: ClipsExtensionPointWithLocal<Point>;
  options?: OptionsForExtensionPoint<Point>;
  installed?: ClipsExtensionPointInstance<Point>;
}) {
  const local = useLocalClipInstance(extension, extension.local, options);

  return (
    <ClipRenderer extension={extension} installed={installed} local={local} />
  );
}

function ViewAppAction() {
  return (
    <Action
      icon="arrowEnd"
      onPress={() => alert('App page not implemented yet!')}
    >
      View app
    </Action>
  );
}

function RestartClipAction({
  instance,
}: {
  instance: ClipsExtensionPointInstance<any>;
}) {
  return (
    <Action icon="sync" onPress={() => instance.restart()}>
      Restart
    </Action>
  );
}

function UninstallClipAction({
  extension,
}: {
  extension: ClipsExtensionPoint<any>;
  installed: InstalledClipsExtensionPoint;
}) {
  const uninstallClipsExtensionFromClip = useMutation(
    uninstallClipsExtensionFromClipMutation,
  );

  const {id} = extension.extension;

  return (
    <Action
      icon="delete"
      onPress={async () => {
        await uninstallClipsExtensionFromClip.mutateAsync({id});
      }}
    >
      Uninstall
    </Action>
  );
}

function ReportIssueAction() {
  return (
    <Action
      icon="message"
      onPress={() => alert('Reporting not implemented yet!')}
    >
      Report an issue
    </Action>
  );
}

function ClipInstanceRenderer<Point extends ExtensionPoint>({
  instance,
}: {
  instance: ClipsExtensionPointInstance<Point>;
}) {
  const controller = useMemo(
    () => createController(instance.components),
    [instance],
  );

  useEffect(() => {
    const abort = new AbortController();

    instance.render({signal: abort.signal});

    return () => {
      abort.abort();
    };
  }, [instance]);

  return (
    <RemoteRenderer
      controller={controller}
      receiver={instance.receiver.value}
    />
  );
}

function useInstalledClipInstance<Point extends ExtensionPoint>(
  extension: ClipsExtensionPoint<Point>,
  installed?: InstalledClipsExtensionPoint,
  options?: OptionsForExtensionPoint<Point>,
) {
  const manager = useClipsManager();

  if (installed == null) return undefined;

  return manager.fetchInstance(
    {
      target: extension.target,
      version: installed.version,
      source: 'installed',
      extension: {id: extension.extension.id},
      script: {url: installed.script},
    },
    // @ts-expect-error Can’t make the types work here :/
    options,
  );
}

const DEFAULT_BUILD_STATE = {
  __typename: 'ExtensionBuildInProgress',
  id: '0',
  startedAt: new Date().toISOString(),
} as const;

function useLocalClipInstance<Point extends ExtensionPoint>(
  extension: ClipsExtensionPoint<Point>,
  _local: LocalClipsExtensionPoint,
  options?: OptionsForExtensionPoint<Point>,
) {
  const manager = useClipsManager();
  const result = useLocalDevelopmentServerQuerySignal(localClipQuery, {
    variables: {id: extension.extension.id},
  });
  const script = useSignal<string | undefined>(undefined);
  const instanceDetailsRef = useRef<{
    lastBuild: LocalClipQueryData.App.ClipsExtension.Build;
    instance?: ClipsExtensionPointInstance<Point>;
    lastBuildSuccess?: LocalClipQueryData.App.ClipsExtension.Build_ExtensionBuildSuccess;
  }>({lastBuild: DEFAULT_BUILD_STATE});

  useSignalEffect(() => {
    if (!result.value.data) return;

    const buildState =
      result.value.data.app?.clipsExtension?.build ?? DEFAULT_BUILD_STATE;

    const isRestart =
      buildState.__typename === 'ExtensionBuildSuccess' &&
      instanceDetailsRef.current.lastBuildSuccess != null;

    instanceDetailsRef.current.lastBuild = buildState;
    if (buildState.__typename === 'ExtensionBuildSuccess') {
      instanceDetailsRef.current.lastBuildSuccess = buildState;
      script.value = buildState.assets[0]?.source;
    }

    if (isRestart) {
      instanceDetailsRef.current.instance?.restart();
    }
  });

  const scriptUrl = script.value;

  if (scriptUrl == null) return undefined;

  const instance = manager.fetchInstance(
    {
      target: extension.target,
      version: 'unstable',
      source: 'local',
      extension: {id: extension.extension.id},
      script: {url: scriptUrl},
    },
    // @ts-expect-error Can’t make the types work here :/
    options,
  );

  instanceDetailsRef.current.instance = instance;

  return instance;
}
