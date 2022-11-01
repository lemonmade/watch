import {useMemo} from 'react';
import {RemoteRenderer, createController} from '@remote-ui/react/host';
import {type ExtensionPoint} from '@watching/clips';

import {useClipsManager} from '../react';
import {
  type ClipsExtensionPoint,
  type InstalledClipsExtensionPoint,
} from '../extension';
import {
  type ExtensionPointWithOptions,
  type OptionsForExtensionPoint,
} from '../extension-points';

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
  console.log(extension);
  if (extension.installed) {
    return (
      <InstalledClipRenderer
        extension={extension}
        options={options as OptionsForExtensionPoint<Point>}
        installed={extension.installed}
      />
    );
  }

  return null;
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
  const instance = useClipsManager().fetchInstance(
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

  const controller = useMemo(
    () => createController(instance.components),
    [instance],
  );

  return (
    <RemoteRenderer
      controller={controller}
      receiver={instance.receiver.value}
    />
  );
}
