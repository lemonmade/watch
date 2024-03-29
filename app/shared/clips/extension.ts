import {type Signal} from '@quilted/quilt/signals';
import {type ThreadCallable} from '@quilted/quilt/threads';
import {type ThreadRenderer} from '@watching/thread-render';
import {type RemoteComponentRendererMap} from '@remote-dom/react/host';
import {type GraphQLFetch} from '@quilted/graphql';

import {type Version, type ExtensionPoint, type Api} from '@watching/clips';

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

export interface ClipsExtensionPointInstanceLoadingElement {
  readonly type: string;
  readonly properties: Record<string, unknown>;
  readonly children: readonly (
    | string
    | ClipsExtensionPointInstanceLoadingElement
  )[];
}

export interface ClipsExtensionPointInstanceContext<
  Point extends ExtensionPoint,
> {
  readonly settings: Signal<Record<string, unknown>>;
  readonly liveQuery: LiveQueryRunner<Point>;
  readonly loadingUi: Signal<
    ClipsExtensionPointInstanceLoadingElement['children'] | undefined
  >;
  readonly mutate: Api<Point>['mutate'];
  readonly components: RemoteComponentRendererMap;
  readonly sandbox: ThreadCallable<Sandbox>;
  readonly graphql: GraphQLFetch;
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
  readonly loadingUi?: ClipsExtensionPointInstanceLoadingElement['children'];
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
