import {
  type GraphQLOperation,
  type GraphQLVariableOptions,
} from '@quilted/graphql';
import {type Translate} from '@quilted/localize';
import {type ThreadSignalSerialization} from '@quilted/threads/signals';
import {type Signal} from '@preact/signals-core';

import {type ExtensionPoint} from './extension-points';

export type {GraphQLOperation, Translate};

export type Version = 'unstable';

export interface Api<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  readonly version: Version;
  readonly target: Point;
  readonly settings: Signal<Settings>;
  readonly localize: LocalizeApi;
  readonly query: Signal<Query>;
  readonly mutate: MutateApi;
}

export interface MutateApi {
  <Data = unknown, Variables = unknown>(
    operation: GraphQLOperation<Data, Variables> | string,
    options?: GraphQLVariableOptions<Variables>,
  ): Promise<Data>;
}

export interface LocalizeApi {
  readonly locale: string;
  readonly translate: Translate;
}

export interface ApiCore<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  readonly version: Version;
  readonly target: Point;
  readonly settings: ThreadSignalSerialization<Settings>;
  readonly localize: {readonly locale: string; translations?: string};
  readonly query: ThreadSignalSerialization<Query>;
  readonly mutate: MutateApi;
}
