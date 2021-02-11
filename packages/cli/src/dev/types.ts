export interface MessageMap {
  // eslint-disable-next-line @typescript-eslint/ban-types
  compile: {};
  stats:
    | {status: 'unchanged'; hash: string; errors?: never; warnings?: never}
    | {status: 'ok'; hash: string; errors?: never; warnings?: never}
    | {status: 'errors'; hash: string; errors: string[]; warnings?: never}
    | {status: 'warnings'; hash: string; errors?: never; warnings: string[]};
  // eslint-disable-next-line @typescript-eslint/ban-types
  close: {};
}
