import {useEffect, useMemo, useRef} from 'react';
import {type ExtensionPoint} from '@watching/clips';
import {RemoteRenderer, createController} from '@remote-ui/react/host';

import {useClipsManager, useLocalDevelopmentServerQuery} from '../react';
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

import localClipQuery from './graphql/LocalClipQuery.graphql';

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
  const {data} = useLocalDevelopmentServerQuery(localClipQuery, {
    variables: {id: extension.extension.id},
  });

  const buildState = data?.app?.clipsExtension?.build ?? DEFAULT_BUILD_STATE;

  const instanceDetailsRef = useRef<{script: string}>();

  if (buildState.__typename === 'ExtensionBuildSuccess') {
    instanceDetailsRef.current = {
      script: buildState.assets[0]!.source,
    };
  }

  if (!instanceDetailsRef.current) return null;

  const instance = manager.fetchInstance(
    {
      target: extension.target,
      version: 'unstable',
      source: 'local',
      extension: {id: extension.extension.id},
      script: {url: instanceDetailsRef.current.script},
    },
    // @ts-expect-error Can’t make the types work here :/
    options,
  );

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
