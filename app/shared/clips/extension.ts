import {type ThreadCallable} from '@quilted/quilt/threads';
import {type ThreadRenderer} from '@watching/thread-render';
import {type RemoteComponentRendererMap} from '@lemonmade/remote-ui-react/host';

import {type Version, type ExtensionPoint} from '@watching/clips';
import {type Signal} from '@watching/thread-signals';

import {type OptionsForExtensionPoint} from './extension-points.ts';
import {type Sandbox} from './sandbox.ts';
import {type LiveQueryRunner} from './live-query.ts';

export type {Version, ExtensionPoint};

export interface ClipsExtensionPoint<Point extends ExtensionPoint> {
  readonly id: string;
  readonly target: Point;
  readonly extension: ClipsExtension;
  readonly local?: ClipsExtensionPointLocalInstanceOptions<Point>;
  readonly installed?: ClipsExtensionPointInstalledInstanceOptions<Point>;
}

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
  extends ThreadRenderer<ClipsExtensionPointInstanceContext<Point>> {}

export interface ClipsExtensionPointInstanceContext<
  Point extends ExtensionPoint,
> {
  readonly settings: Signal<Record<string, unknown>>;
  readonly liveQuery: LiveQueryRunner<Point>;
  readonly components: RemoteComponentRendererMap;
  readonly sandbox: ThreadCallable<Sandbox>;
}

export type ClipsExtensionPointInstanceOptions<Point extends ExtensionPoint> =
  | ClipsExtensionPointInstalledInstanceOptions<Point>
  | ClipsExtensionPointLocalInstanceOptions<Point>;

export interface ClipsExtensionPointInstalledInstanceOptions<
  Point extends ExtensionPoint,
> {
  readonly source: 'installed';
  readonly target: Point;
  readonly version: Version;
  readonly settings?: string;
  readonly liveQuery?: string;
  readonly extension: {readonly id: string};
  readonly script: {readonly url: string};
  readonly options: OptionsForExtensionPoint<Point>;
}

export interface ClipsExtensionPointLocalInstanceOptions<
  Point extends ExtensionPoint,
> {
  readonly source: 'local';
  readonly target: Point;
  readonly extension: {readonly id: string};
  readonly options: OptionsForExtensionPoint<Point>;
}

export type ClipsExtensionSandbox = Omit<Sandbox, 'load'>;
