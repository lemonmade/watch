import {type RemoteReceiver} from '@remote-ui/core';
import {
  type Version,
  type ExtensionPoint,
  ApiForExtensionPoint,
} from '@watching/clips';
import {type Emitter} from '@quilted/quilt';
import {type Signal} from '@watching/thread-signals';

import {type OptionsForExtensionPoint} from './extension-points';
import {type ReactComponentsForExtensionPoint} from './components';
import {type Sandbox} from './sandboxes';

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

export interface ClipsExtensionPointInstance<Point extends ExtensionPoint> {
  readonly id: string;
  readonly context: ClipsExtensionPointInstanceContext<Point>;
  readonly options: ClipsExtensionPointInstanceOptions<Point>;
  readonly timings: Signal<ClipsExtensionPointInstanceTiming>;
  readonly receiver: Signal<RemoteReceiver>;
  readonly state: Signal<
    'stopped' | 'loading' | 'loaded' | 'rendering' | 'rendered'
  >;
  readonly api: ApiForExtensionPoint<Point>;
  readonly components: ReactComponentsForExtensionPoint<Point>;
  readonly sandbox: ClipsExtensionSandboxInstance;
  readonly on: Emitter<ClipsExtensionPointInstanceEventMap>['on'];
  render(options?: {signal?: AbortSignal}): void;
  restart(): Promise<void>;
}

export interface ClipsExtensionPointInstanceContext<
  _Point extends ExtensionPoint,
> {
  readonly settings: Signal<Record<string, unknown>>;
}

export interface ClipsExtensionPointInstanceOptions<
  Point extends ExtensionPoint,
> {
  readonly source: 'local' | 'installed';
  readonly target: Point;
  readonly version: Version;
  readonly settings?: string;
  readonly extension: {readonly id: string};
  readonly script: {readonly url: string};
  readonly options: OptionsForExtensionPoint<Point>;
}

export interface ClipsExtensionPointInstanceTiming {
  readonly loadStart?: number;
  readonly loadEnd?: number;
  readonly renderStart?: number;
  readonly renderEnd?: number;
}

export interface ClipsExtensionPointInstanceEventMap {
  start: void;
  stop: void;
  load: void;
  render: void;
  mount: void;
}

export type ClipsExtensionSandbox = Omit<Sandbox, 'load'>;

export interface ClipsExtensionSandboxInstance {
  readonly id: string;
  readonly state: Signal<'stopped' | 'starting' | 'loading' | 'loaded'>;
  readonly timings: Signal<ClipsExtensionSandboxInstanceTiming>;
  readonly on: Emitter<ClipsExtensionSandboxInstanceEventMap>['on'];
  start(): Promise<void>;
  stop(): void;
  restart(): Promise<void>;
  run<T>(
    runner: (sandbox: ClipsExtensionSandbox) => T | Promise<T>,
  ): Promise<T>;
}

export interface ClipsExtensionSandboxInstanceTiming {
  readonly start?: number;
  readonly loadStart?: number;
  readonly loadEnd?: number;
}

export interface ClipsExtensionSandboxInstanceEventMap {
  start: void;
  stop: void;
  'load:start': void;
  'load:end': void;
}
