import {
  createHttpHandler,
  html,
  json,
  noContent,
  type EnhancedRequest,
} from '@quilted/quilt/http-handlers';
import {stripIndent} from 'common-tags';

import {getUserIdFromRequest} from './shared/auth';
import {createPrisma, type Prisma} from './shared/database';

import type {Authentication} from './graphql/context';

const ACCESS_TOKEN_HEADER = 'X-Access-Token';

const handler = createHttpHandler();

handler.options(() =>
  noContent({
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Method': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  }),
);

handler.post(async (request) => {
  const {operationName, query, variables} = await request.json();

  /* eslint-disable no-console */
  console.log(`Performing operation: ${operationName}`);
  console.log(`Variables:\n${JSON.stringify(variables ?? {}, null, 2)}`);
  console.log(`Document:\n${query}`);
  /* eslint-enable no-console */

  const {headers, cookies} = json(
    {},
    {
      status: 200,
      headers: {'Access-Control-Allow-Origin': '*'},
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
    import('./graphql/context'),
  ]);

  try {
    const result = await graphql(
      schema,
      query,
      {},
      createContext(auth, prisma, request, response),
      variables,
      operationName,
    );

    return json(result, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);

    return json(
      {message: (error as any).message},
      {
        status: (error as any).statusCode ?? 500,
        headers: {'Access-Control-Allow-Origin': '*'},
      },
    );
  }
});

export default handler;

let schemaPromise: Promise<any>;

function loadSchema() {
  schemaPromise ??= (async () => {
    const [{makeExecutableSchema}, resolvers, {default: schemaSource}] =
      await Promise.all([
        import('@graphql-tools/schema'),
        import('./graphql/resolvers'),
        import('./graphql/schema'),
      ]);

    const schema = makeExecutableSchema({
      resolvers,
      typeDefs: schemaSource,
    });

    return schema;
  })();

  return schemaPromise;
}

async function authenticate(
  request: EnhancedRequest,
  prisma: Prisma,
): Promise<Authentication> {
  const cookieAuthUserId = await getUserIdFromRequest(request);

  if (cookieAuthUserId) {
    return {type: 'cookie', userId: cookieAuthUserId};
  }

  const accessToken = request.headers.get(ACCESS_TOKEN_HEADER);

  if (accessToken == null) {
    return {type: 'unauthenticated'};
  }

  const token = await prisma.personalAccessToken.findFirst({
    where: {token: accessToken},
  });

  if (token == null) {
    throw new Error('Invalid token');
  }

  await prisma.personalAccessToken.update({
    where: {id: token.id},
    data: {lastUsedAt: new Date()},
  });

  return {type: 'accessToken', userId: token.userId};
}

handler.get(() => {
  return html(stripIndent`
    <!DOCTYPE html>
    <html>
      <head>
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
                url: window.location.href,
              }),
              defaultEditorToolsVisibility: true,
            }),
            document.getElementById('graphiql'),
          );
        </script>
      </body>
    </html>
  `);
});
