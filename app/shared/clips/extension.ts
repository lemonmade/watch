import {type Signal} from '@quilted/quilt/signals';
import {type Thread} from '@quilted/quilt/threads';
import {type ThreadRenderer} from '@watching/thread-render';
import {type RemoteComponentRendererMap} from '@remote-dom/react/host';
import {type GraphQLFetch} from '@quilted/graphql';

import {type Version, type ExtensionPoint, type Api} from '@watching/clips';

import {type OptionsForExtensionPoint} from './extension-points.ts';
import {type Sandbox} from './sandbox.ts';
import {type LiveQueryRunner} from './live-query.ts';
import {type ClipsManagerType} from './manager.ts';

export type {Version, ExtensionPoint};

export interface ClipsExtensionPointRenderer<Point extends ExtensionPoint>
  extends ThreadRenderer<ClipsExtensionPointInstanceContext<Point>> {}

export interface ClipsExtensionPoint<Point extends ExtensionPoint> {
  readonly id: string;
  readonly target: Point;
  readonly installation: ClipsExtensionInstallation;
  readonly extension: ClipsExtension;
  readonly manager: ClipsManagerType;
  readonly options: OptionsForExtensionPoint<Point>;
  readonly local?: {
    readonly renderer: ClipsExtensionPointRenderer<Point>;
  };
  readonly installed?: {
    readonly renderer: ClipsExtensionPointRenderer<Point>;
  };
}

export interface ClipsExtensionInstallation {
  readonly id: string;
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

export interface ClipsExtensionPointInstanceContext<
  Point extends ExtensionPoint,
> {
  readonly settings: Signal<Record<string, unknown>>;
  readonly liveQuery: LiveQueryRunner<Point>;
  readonly loadingUi: Signal<string | undefined>;
  readonly mutate: Api<Point>['mutate'];
  readonly components: RemoteComponentRendererMap;
  readonly sandbox: Thread<Sandbox>;
  readonly graphql: GraphQLFetch;
}

export interface ClipsExtensionPointInstalledInstanceOptions<
  Point extends ExtensionPoint,
> {
  readonly source: 'installed';
  readonly target: Point;
  readonly version: Version;
  readonly settings?: string;
  readonly liveQuery?: string;
  readonly loadingUi?: string;
  readonly translations?: string;
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
