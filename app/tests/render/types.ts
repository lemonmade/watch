import type {TestRouter} from '@quilted/quilt/navigation/testing';
import type {BrowserTestMock} from '@quilted/quilt/browser/testing';

import type {AppContext} from '~/shared/context.ts';

import type {GraphQLController} from '../graphql.ts';
import type {TestEnvironment} from '../environment.ts';

export interface RenderOptions {
  /**
   * A custom router to use for this component test. You can use a
   * custom router to simulate a particular URL, and you can spy on
   * its navigation method to check that components navigate as
   * you expect.
   */
  readonly router?: TestRouter;

  /**
   * A custom environment for this component test.
   */
  readonly browser?: BrowserTestMock;

  /**
   * A custom locale to use for this component test.
   */
  readonly locale?: string;

  /**
   * An object that controls the responses to GraphQL queries and mutations
   * for the component under test. You can customize the responses using
   * the `fillGraphQL` and `createGraphQLController` utilities provided
   * by this module.
   *
   * ```tsx
   * import {renderApp} from '~/tests/render.ts';
   * import {fillGraphQL, GraphQLController} from '~/tests/graphql.ts';
   *
   * import {MyComponent} from './MyComponent.tsx';
   * import myComponentQuery from './MyComponentQuery.graphql';
   *
   * const myComponent = await renderApp(<MyComponent />, {
   *   graphql: new GraphQLController([
   *     fillGraphQL(myComponentQuery, {me: {name: 'Winston'}}),
   *   ]),
   * });
   * ```
   */
  readonly graphql?: GraphQLController;

  /**
   * A custom environment for this component test.
   */
  readonly environment?: TestEnvironment;
}

export interface RenderContext extends AppContext {
  /**
   * The router used for this component test.
   */
  readonly router: TestRouter;

  /**
   * The browser environment for this component test.
   */
  readonly browser: BrowserTestMock;

  /**
   * The GraphQL controller used for this component test.
   */
  readonly graphQLController: GraphQLController;

  /**
   * The environment for this component test.
   */
  readonly environment: TestEnvironment;
}

export interface RenderActions extends Record<string, never> {}
