import {type ReadonlySignal} from '@preact/signals-core';
import {type Emitter} from '@quilted/events';
import {type SignalRemoteReceiver} from '@lemonmade/remote-ui-preact/host';

export interface ThreadRenderer<Context = Record<string, never>> {
  readonly signal: AbortSignal;
  readonly instance: ReadonlySignal<
    ThreadRendererInstance<Context> | undefined
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

export interface ThreadRendererInstance<Context = Record<string, never>> {
  readonly signal: AbortSignal;
  readonly timings: ReadonlySignal<ThreadRendererInstanceTimings>;
  readonly receiver: SignalRemoteReceiver;
  readonly context: Context;
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
  readonly prepareStart?: number;
  readonly prepareEnd?: number;
  readonly renderStart?: number;
  readonly renderEnd?: number;
  readonly destroyStart?: number;
  readonly destroyEnd?: number;
}

export interface ThreadRendererInstanceEventMap {
  'prepare:start': void;
  'prepare:abort': void;
  'prepare:end': void;
  'render:start': void;
  'render:abort': void;
  'render:end': void;
  'destroy:start': void;
  'destroy:abort': void;
  'destroy:end': void;
}
