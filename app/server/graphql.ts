import {
  HTMLResponse,
  JSONResponse,
  NoContentResponse,
  RequestRouter,
  EnhancedRequest,
} from '@quilted/quilt/request-router';
import {stripIndent} from 'common-tags';

import {authenticate} from './shared/auth.ts';
import {createPrisma} from './shared/database.ts';

const router = new RequestRouter();

router.options(
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

router.post('/', async (request) => {
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
  });

  return response;
});

router.post('/clips', async (request) => {
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
  });

  return response;
});

router.get('/', async (request) => {
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
    searchParams.get('operation-name');

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
  });

  return response;
});

async function runGraphQLRequest(
  request: EnhancedRequest,
  {
    operation,
    variables,
    operationName,
  }: {
    operation: string;
    operationName?: string | null;
    variables?: Record<string, unknown> | null;
    extensions?: Record<string, unknown> | null;
  },
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

  const prisma = await createPrisma();
  const auth = await authenticate(request, prisma);

  const [schema, {graphql}, {createContext}] = await Promise.all([
    loadSchema(),
    import('graphql'),
    import('./graphql/context.ts'),
  ]);

  try {
    const result = await graphql({
      schema,
      source: operation,
      operationName,
      variableValues: variables,
      contextValue: createContext(auth, prisma, request, response),
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

let schemaPromise: Promise<import('graphql').GraphQLSchema>;

function loadSchema() {
  schemaPromise ??= (async () => {
    const [{createGraphQLSchema}, resolvers, {default: schemaSource}] =
      await Promise.all([
        import('@quilted/quilt/graphql/server'),
        import('./graphql/resolvers.ts'),
        import('./graphql/schema.ts'),
      ]);

    return createGraphQLSchema(schemaSource, resolvers);
  })();

  return schemaPromise;
}

router.get('/explorer', () => {
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

export default router;
