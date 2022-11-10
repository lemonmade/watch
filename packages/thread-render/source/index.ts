import {type ReadonlySignal} from '@preact/signals-core';
import {type Emitter} from '@quilted/events';
import {type RemoteReceiver} from '@remote-ui/core';

export interface ThreadRenderer<
  Api = Record<string, never>,
  Components = Record<string, never>,
  Thread = Record<string, never>,
  Options = Record<string, never>,
  Context = Record<string, never>,
> {
  readonly id: string;
  readonly context: Context;
  readonly options: Options;
  readonly signal: AbortSignal;
  readonly instance: ReadonlySignal<
    ThreadRendererInstance<Api, Components, Thread> | undefined
  >;
  readonly on: Emitter<ThreadRendererEventMap>['on'];
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  destroy(): Promise<void>;
}

export interface ThreadRendererEventMap {
  start: void;
  stop: void;
  restart: void;
  destroy: void;
}

export interface ThreadRendererInstance<
  Api = Record<string, never>,
  Components = Record<string, never>,
  Thread = Record<string, never>,
> {
  readonly thread: Thread;
  readonly signal: AbortSignal;
  readonly timings: ReadonlySignal<ThreadRendererInstanceTimings>;
  readonly receiver: RemoteReceiver;
  readonly api: Api;
  readonly components: Components;
  readonly state: ReadonlySignal<ThreadRendererInstanceState>;
  readonly on: Emitter<ThreadRendererInstanceEventMap>['on'];
}

export type ThreadRendererInstanceState =
  | 'preparing'
  | 'rendering'
  | 'rendered'
  | 'stopping'
  | 'stopped';

export interface ThreadRendererInstanceTimings {
  readonly prepareStart: number;
  readonly prepareEnd?: number;
  readonly renderStart?: number;
  readonly renderEnd?: number;
  readonly destroyStart?: number;
  readonly destroyEnd?: number;
}

export interface ThreadRendererInstanceEventMap {
  prepare: void;
  render: void;
  destroy: void;
}
