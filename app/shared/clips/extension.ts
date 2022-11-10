import {type ThreadRenderer} from '@watching/thread-render';

import {type Api, type Version, type ExtensionPoint} from '@watching/clips';
import {type Signal} from '@watching/thread-signals';

import {type OptionsForExtensionPoint} from './extension-points';
import {type ReactComponentsForExtensionPoint} from './components';
import {type Sandbox} from './sandboxes';
import {type LiveQueryRunner} from './live-query';

export type {Version, ExtensionPoint};

export interface ClipsExtensionPoint<Point extends ExtensionPoint> {
  readonly id: string;
  readonly target: Point;
  readonly extension: ClipsExtension;
  readonly local?: LocalClipsExtensionPoint;
  readonly installed?: InstalledClipsExtensionPoint;
}

export interface ClipsExtensionPointWithLocal<Point extends ExtensionPoint>
  extends Omit<ClipsExtensionPoint<Point>, 'local'> {
  readonly local: LocalClipsExtensionPoint;
}

export interface ClipsExtensionPointWithInstalled<Point extends ExtensionPoint>
  extends Omit<ClipsExtensionPoint<Point>, 'installed'> {
  readonly installed: InstalledClipsExtensionPoint;
}

export interface InstalledClipsExtensionPoint {
  readonly version: Version;
  readonly script: string;
  readonly settings?: string;
  readonly liveQuery?: string;
}

export interface LocalClipsExtensionPoint {}

export interface ClipsExtension {
  readonly id: string;
  readonly name: string;
  readonly app: App;
}

export interface App {
  readonly id: string;
  readonly name: string;
}

export interface ClipsExtensionPointInstance<Point extends ExtensionPoint>
  extends ThreadRenderer<
    Api<Point>,
    ReactComponentsForExtensionPoint<Point>,
    ClipsExtensionSandbox,
    ClipsExtensionPointInstanceOptions<Point>,
    ClipsExtensionPointInstanceContext<Point>
  > {}

export interface ClipsExtensionPointInstanceContext<
  Point extends ExtensionPoint,
> {
  readonly settings: Signal<Record<string, unknown>>;
  readonly liveQuery: LiveQueryRunner<Point>;
}

export interface ClipsExtensionPointInstanceOptions<
  Point extends ExtensionPoint,
> {
  readonly source: 'local' | 'installed';
  readonly target: Point;
  readonly version: Version;
  readonly settings?: string;
  readonly liveQuery?: string;
  readonly extension: ClipsExtensionPoint<Point>;
  readonly script: {readonly url: string};
  readonly options: OptionsForExtensionPoint<Point>;
}

export type ClipsExtensionSandbox = Omit<Sandbox, 'load'>;
