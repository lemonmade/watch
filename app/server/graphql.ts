import {
  HTMLResponse,
  JSONResponse,
  NoContentResponse,
  EnhancedRequest,
} from '@quilted/quilt/request-router';
import {stripIndent} from 'common-tags';
import {Hono} from 'hono';

import {E2E_TEST_CONTEXT_HEADER} from '~/global/e2e.ts';
import {verifySignedToken} from '~/global/tokens.ts';

import type {
  HonoEnv,
  HonoContextVariableMap,
  E2ETestContext,
} from './context.ts';

import {authenticate} from './shared/auth.ts';
import {createResponseHandler} from './shared/response.ts';
import type {Context} from './graphql/context.ts';

const routes = new Hono<HonoEnv>();

routes.options(
  '/',
  () =>
    new NoContentResponse({
      headers: {
        'Timing-Allow-Origin': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Method': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }),
);

routes.post(
  '/',
  createResponseHandler(
    async (request, {env, var: {prisma: prismaContext}}) => {
      const {
        name,
        operationName,
        query,
        mutation,
        operation,
        variables,
        extensions,
      } = (await request.json()) as any;

      const resolvedOperation = operation ?? query ?? mutation;
      const resolvedName = name ?? operationName;

      const response = await runGraphQLRequest(request, {
        operation: resolvedOperation,
        operationName: resolvedName,
        variables,
        extensions,
        env,
        prisma: prismaContext,
      });

      return response;
    },
  ),
);

routes.post(
  '/clips',
  createResponseHandler(
    async (request, {env, var: {prisma: prismaContext}}) => {
      const extension = request.URL.searchParams.get('extension');

      if (extension) {
        console.log(`Running GraphQL operation for extension ${extension}`);
      } else {
        return new JSONResponse(
          {errors: [{message: 'Missing extension'}]},
          {
            status: 400,
            headers: {
              'Timing-Allow-Origin': '*',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-store',
            },
          },
        );
      }

      const {
        name,
        operationName,
        query,
        mutation,
        operation,
        variables,
        extensions,
      } = (await request.json()) as any;

      const resolvedOperation = operation ?? query ?? mutation;
      const resolvedName = name ?? operationName;

      const response = await runGraphQLRequest(request, {
        operation: resolvedOperation,
        operationName: resolvedName,
        variables,
        extensions,
        env,
        prisma: prismaContext,
      });

      return response;
    },
  ),
);

routes.get(
  '/',
  createResponseHandler(
    async (request, {env, var: {prisma: prismaContext}}) => {
      const {searchParams} = request.URL;
      const operation =
        searchParams.get('operation') ??
        searchParams.get('query') ??
        searchParams.get('mutation');
      const variables = searchParams.get('variables');
      const extensions = searchParams.get('extensions');
      const operationName =
        searchParams.get('name') ??
        searchParams.get('operationName') ??
        searchParams.get('operation-name') ??
        undefined;

      if (operation == null) {
        return new JSONResponse(
          {errors: [{message: 'Missing operation'}]},
          {
            status: 400,
            headers: {
              'Timing-Allow-Origin': '*',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-store',
            },
          },
        );
      }

      const response = await runGraphQLRequest(request, {
        operation: operation!,
        operationName,
        variables: variables ? JSON.parse(variables) : undefined,
        extensions: extensions ? JSON.parse(extensions) : undefined,
        env,
        prisma: prismaContext,
      });

      return response;
    },
  ),
);

export async function runGraphQLRequest(
  request: EnhancedRequest,
  {
    operation,
    variables,
    operationName,
    env,
    prisma: prismaContext,
  }: {
    operation: string;
    operationName?: string;
    variables?: Record<string, unknown> | null;
    extensions?: Record<string, unknown> | null;
  } & Pick<HonoContextVariableMap, 'prisma'> &
    Pick<Context, 'env'>,
) {
  console.log(`Performing operation: ${operationName}`);
  console.log(`Variables:\n${JSON.stringify(variables ?? {}, null, 2)}`);
  console.log(`Document:\n${operation}`);

  const {headers, cookies} = new JSONResponse(
    {},
    {
      status: 200,
      headers: {
        'Timing-Allow-Origin': '*',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    },
  );

  const response = {
    status: 200,
    headers,
    cookies,
  };

  const [prisma, {fetchGraphQL}] = await Promise.all([
    prismaContext.load(),
    import('./graphql/fetch.ts'),
  ]);

  const auth = await authenticate(request, {prisma, env});

  const e2e = await e2eTestContextForRequest(request, {env});

  try {
    const result = await fetchGraphQL(operation, {
      variables,
      operationName,
      context: {
        prisma,
        request,
        response,
        e2e,
        env,
        get user() {
          if (auth.user == null) {
            response.status = 401;
            throw new Error('No user exists for this request!');
          }

          return auth.user;
        },
      },
    });

    return new JSONResponse(result, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.log(error);

    return new JSONResponse(
      {message: (error as any).message},
      {
        status: (error as any).statusCode ?? 500,
        headers: {
          'Timing-Allow-Origin': '*',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}

async function e2eTestContextForRequest(
  request: EnhancedRequest,
  {env}: Pick<Context, 'env'>,
) {
  const e2eHeader = request.headers.get(E2E_TEST_CONTEXT_HEADER);
  const e2e = e2eHeader
    ? await parseE2ETestHeader(e2eHeader, {env})
    : undefined;
  return e2e;
}

async function parseE2ETestHeader(header: string, {env}: Pick<Context, 'env'>) {
  try {
    const verifiedHeader = await verifySignedToken<E2ETestContext>(header, {
      secret: env.JWT_E2E_TEST_HEADER_SECRET,
    });

    if (verifiedHeader.expired) {
      console.error(`E2E test header expired`);
      return undefined;
    }

    const context = verifiedHeader.data;
    console.log(`Parsed E2E test header: ${JSON.stringify(context)}`);
    return context;
  } catch (error) {
    console.error(`Error parsing E2E test header: ${error}`);
    return undefined;
  }
}

routes.get('/explorer', () => {
  return new HTMLResponse(
    stripIndent`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Watch • GraphQL</title>
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>📺</text></svg>">
          <meta charset="utf-8">

          <style>
            body {
              height: 100%;
              margin: 0;
              width: 100%;
              overflow: hidden;
            }
      
            #graphiql {
              height: 100vh;
            }
          </style>
      
          <script
            crossorigin
            src="https://unpkg.com/react@17/umd/react.development.js"
          ></script>
          <script
            crossorigin
            src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"
          ></script>
      
          <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
        </head>
      
        <body>
          <div id="graphiql">Loading...</div>
          <script
            src="https://unpkg.com/graphiql/graphiql.min.js"
            type="application/javascript"
          ></script>
          <script>
            ReactDOM.render(
              React.createElement(GraphiQL, {
                fetcher: GraphiQL.createFetcher({
                  url: new URL('/api/graphql', window.location.href),
                }),
                defaultEditorToolsVisibility: true,
              }),
              document.getElementById('graphiql'),
            );
          </script>
        </body>
      </html>
    `,
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
});

export default routes;
