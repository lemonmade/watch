import {type ReadonlySignal} from '@preact/signals-core';
import {type EventEmitter} from '@quilted/events';
import {type SignalRemoteReceiver} from '@remote-dom/signals';

export interface ThreadRenderer<Context = Record<string, never>>
  extends Pick<EventEmitter<ThreadRendererEventMap>, 'on' | 'once'> {
  readonly signal: AbortSignal;
  readonly instance: ThreadRendererInstance<Context> | undefined;
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

export interface ThreadRendererInstance<Context = Record<string, never>>
  extends Pick<EventEmitter<ThreadRendererInstanceEventMap>, 'on' | 'once'> {
  readonly signal: AbortSignal;
  readonly timings: ReadonlySignal<ThreadRendererInstanceTimings>;
  readonly receiver: SignalRemoteReceiver;
  readonly context: Context;
  readonly state: ReadonlySignal<ThreadRendererInstanceState>;
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
