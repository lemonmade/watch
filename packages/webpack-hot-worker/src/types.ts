export type BuildState =
  | {status: 'ok'; hash: string; errors?: never; warnings?: never}
  | {status: 'errors'; hash: string; errors: string[]; warnings?: never}
  | {status: 'warnings'; hash: string; errors?: never; warnings: string[]};

export interface WebSocketEventMap {
  connect:
    | {status: 'building'; hash?: never; errors?: never; warnings?: never}
    | BuildState;
  compile: {compiler?: string};
  invalidate: {file?: string};
  done:
    | {status: 'unchanged'; hash: string; errors?: never; warnings?: never}
    | BuildState;
  close: never;
}
export interface EventHandler<T> {
  (data: T): void;
}
