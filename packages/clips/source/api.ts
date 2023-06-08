import {
  type GraphQLOperation,
  type GraphQLVariableOptions,
} from '@quilted/graphql';
import {type Signal, type ThreadSignal} from '@watching/thread-signals';

import {type ExtensionPoint} from './extension-points';

export type Version = 'unstable';

export interface Api<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  readonly version: Version;
  readonly target: Point;
  readonly settings: Signal<Settings>;
  readonly query: Signal<Query>;
  mutate<Data = unknown, Variables = unknown>(
    operation: GraphQLOperation<Data, Variables> | string,
    options?: GraphQLVariableOptions<Variables>,
  ): Promise<Data>;
}

export interface MutateApi {
  <Data = unknown, Variables = unknown>(
    operation: GraphQLOperation<Data, Variables> | string,
    options?: GraphQLVariableOptions<Variables>,
  ): Promise<Data>;
}

export interface ApiCore<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  readonly version: Version;
  readonly target: Point;
  readonly settings: ThreadSignal<Settings>;
  readonly query: ThreadSignal<Query>;
  mutate<Data = unknown, Variables = unknown>(
    operation: GraphQLOperation<Data, Variables> | string,
    options?: GraphQLVariableOptions<Variables>,
  ): Promise<Data>;
}
