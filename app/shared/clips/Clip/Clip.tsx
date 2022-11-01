import {useEffect, useMemo, useRef} from 'react';
import {useSignalEffect, useSignal} from '@quilted/quilt';
import {type ExtensionPoint} from '@watching/clips';
import {RemoteRenderer, createController} from '@remote-ui/react/host';

import {useClipsManager, useLocalDevelopmentServerQuerySignal} from '../react';
import {
  type ClipsExtensionPoint,
  type ClipsExtensionPointInstance,
  type InstalledClipsExtensionPoint,
} from '../extension';
import {
  type ExtensionPointWithOptions,
  type OptionsForExtensionPoint,
} from '../extension-points';

import {ClipFrame} from './ClipFrame';

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
  if (extension.local) {
    return (
      <ClipFrame extension={extension}>
        <LocalClipRenderer
          extension={extension}
          options={options as OptionsForExtensionPoint<Point>}
        />
      </ClipFrame>
    );
  }

  if (extension.installed) {
    return (
      <ClipFrame extension={extension}>
        <InstalledClipRenderer
          extension={extension}
          options={options as OptionsForExtensionPoint<Point>}
          installed={extension.installed}
        />
      </ClipFrame>
    );
  }

  return null;
}

const DEFAULT_BUILD_STATE = {
  __typename: 'ExtensionBuildInProgress',
  id: '0',
  startedAt: new Date().toISOString(),
} as const;

function LocalClipRenderer<Point extends ExtensionPoint>({
  extension,
  options,
}: {
  extension: ClipsExtensionPoint<Point>;
  options?: OptionsForExtensionPoint<Point>;
}) {
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

  if (scriptUrl == null) return null;

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

  return <ClipInstanceRenderer instance={instance} />;
}

function InstalledClipRenderer<Point extends ExtensionPoint>({
  installed,
  extension,
  options,
}: {
  installed: InstalledClipsExtensionPoint;
  extension: ClipsExtensionPoint<Point>;
  options?: OptionsForExtensionPoint<Point>;
}) {
  const manager = useClipsManager();
  const instance = manager.fetchInstance(
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

  return <ClipInstanceRenderer instance={instance} />;
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
