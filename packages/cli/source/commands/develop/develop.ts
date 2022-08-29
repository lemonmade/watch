import '@quilted/polyfills/fetch';

import * as path from 'path';
import type {Server} from 'http';
import {emitKeypressEvents} from 'readline';
import {stat, readFile} from 'fs/promises';
import {
  on,
  createEmitter,
  AbortError,
  NestedAbortController,
} from '@quilted/events';
import {createThread, acceptThreadAbortSignal} from '@quilted/threads';
import type {ThreadTarget, ThreadAbortSignal} from '@quilted/threads';

import {
  createHttpHandler,
  noContent,
  json,
  notFound,
} from '@quilted/http-handlers';
import {createHttpServer} from '@quilted/http-handlers/node';

import WebSocket from 'ws';
import mime from 'mime';
import open from 'open';
import prompts, {type PromptObject} from 'prompts';

import {parse} from 'graphql';

import {watch as rollupWatch} from 'rollup';

import {PrintableError} from '../../ui';
import type {Ui} from '../../ui';

import {watchUrl} from '../../utilities/url';
import {
  rootOutputDirectory,
  ensureRootOutputDirectory,
} from '../../utilities/build';
import {
  previewUrl,
  addConnectSearchParam,
  DEFAULT_PREVIEW_PATH,
} from '../../utilities/preview';

import {
  loadLocalApp,
  LocalExtension,
  LocalExtensionPointSupport,
} from '../../utilities/app';
import type {LocalApp} from '../../utilities/app';

import {findPortAndListen, makeStoppableServer} from '../../utilities/http';
import {createRollupConfiguration} from '../../utilities/rollup';

import {run, createQueryResolver} from './graphql';
import type {Builder, BuildState} from './types';

export async function develop({ui, proxy}: {ui: Ui; proxy?: string}) {
  const app = await loadLocalApp();

  if (app.extensions.length === 0) {
    ui.Heading('heads up!', {style: (content, style) => style.yellow(content)});
    ui.TextBlock(
      `Your app doesn’t have any extensions to push yet. Run ${ui.Code(
        'watchapp create extension',
      )} to get started!`,
    );

    process.exitCode = 1;

    return;
  }

  await ensureRootOutputDirectory(app);
  const devServer = await createDevServer(app, {ui});
  const result = await devServer.listen();

  const localUrl = new URL(proxy ?? `http://localhost:${result.port}`);
  const localSocketUrl = new URL(localUrl);
  localSocketUrl.protocol = localSocketUrl.protocol.replace(/^http/, 'ws');

  try {
    ui.Heading('success!', {style: (content, style) => style.green(content)});
    ui.TextBlock(
      `We’ve started a development server at ${ui.Link(
        localUrl,
      )}. You can press one of these keys to see preview your work:`,
    );

    ui.List((list) => {
      list.Item(
        `${ui.Code('?')} or ${ui.Code(
          '/',
        )} to jump right to one of your extensions`,
      );
      list.Item(`${ui.Code('enter')} to open the developer console`);
      list.Item(`${ui.Code('esc')} to stop the development server`);
    });

    ui.Spacer();

    emitKeypressEvents(process.stdin);
    await runConsole();
  } catch (error) {
    throw new PrintableError(
      `There was a problem while trying to start your development server...`,
      {original: error as any},
    );
  }

  async function runConsole() {
    process.stdin.resume();
    process.stdin.setRawMode(true);

    for await (const [_, key] of on<{
      keypress: [
        unknown,
        {
          name?: string;
          sequence: string;
          ctrl: boolean;
          meta: boolean;
          shift: boolean;
        },
      ];
    }>(process.stdin as any, 'keypress')) {
      if (key.name === 'c' && key.ctrl) {
        return close();
      }

      // Wanted to do this but it didn't work for me:
      // https://stackoverflow.com/questions/50497062/how-to-support-default-z-behavior-in-a-node-program-that-detects-key-presses
      if (key.name === 'z' && key.ctrl) {
        return close();
      }

      if (
        key.name === 'escape' ||
        key.sequence === 'q' ||
        key.sequence === 'Q'
      ) {
        return close();
      }

      if (key.name === 'enter' || key.name === 'return') {
        await open(
          addConnectSearchParam(watchUrl(DEFAULT_PREVIEW_PATH), localSocketUrl)
            .href,
        );
      }

      if (key.sequence === '/' || key.sequence === '?') {
        break;
      }
    }

    process.stdin.setRawMode(false);

    try {
      let extension =
        app.extensions.length === 1 ? app.extensions[0] : undefined;

      if (extension == null) {
        const extensionHandle = await prompt({
          type: 'autocomplete',
          message: 'Which extension would you like to preview?',
          choices: app.extensions.map((extension) => {
            return {title: extension.name, value: extension.handle};
          }),
        });

        extension = app.extensions.find(
          (extension) => extension.handle === extensionHandle,
        );
      }

      if (extension != null) {
        if (extension.extends.length <= 1) {
          await openExtension(extension, extension.extends[0]);
        } else {
          const extensionPointHandle = await prompt({
            type: 'autocomplete',
            message: 'Which extension point would you like to preview?',
            choices: extension.extends.map((extensionPoint) => {
              return {
                title: extensionPoint.target,
              };
            }),
          });

          const extensionPoint = extension.extends.find(
            (extensionPoint) => extensionPoint.target === extensionPointHandle,
          );

          await openExtension(extension, extensionPoint);
        }
      }
    } catch (error) {
      if (error instanceof AbortError) return;
      throw error;
    }

    ui.Spacer();
    await runConsole();
  }

  function close() {
    process.exit();
  }

  async function openExtension(
    extension: LocalExtension,
    extensionPoint?: LocalExtensionPointSupport,
  ) {
    const url = await previewUrl(extension, {
      extensionPoint,
      connect: localSocketUrl,
    });

    await open(url.href);
  }
}

async function prompt(prompt: Omit<PromptObject, 'name'>) {
  const result = await prompts<'value'>(
    {name: 'value', ...prompt},
    {
      onCancel() {
        throw new AbortError();
      },
    },
  );

  return result.value;
}

async function createDevServer(app: LocalApp, {ui}: {ui: Ui}) {
  const handler = createHttpHandler();
  const outputRoot = path.resolve(rootOutputDirectory(app), 'develop');

  const builder = await createBuilder(app, {ui, outputRoot});
  const resolver = createQueryResolver(app, {builder});

  handler.get('/', () =>
    json(app, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    }),
  );

  handler.options('/graphql', () =>
    noContent({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }),
  );

  handler.post('/graphql', async (request) => {
    try {
      const {query, variables} = await request.json();

      const result = await run(query, resolver, {
        variables,
        context: {rootUrl: new URL('/', request.url)},
      }).untilAvailable();

      return json(result, {
        headers: {
          'Timing-Allow-Origin': '*',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      return json(
        {errors: [{message: (error as any).message}]},
        {
          headers: {
            'Timing-Allow-Origin': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        },
      );
    }
  });

  handler.get(
    '/assets',
    async (request) => {
      const assetPath = path.join(
        outputRoot,
        new URL(request.url).pathname.replace('/assets/', ''),
      );

      try {
        const assetStats = await stat(assetPath);

        if (assetStats.isFile()) {
          return new Response(await readFile(assetPath, {encoding: 'utf8'}), {
            headers: {
              'Cache-Control': 'no-store',
              'Timing-Allow-Origin': '*',
              'Content-Type': mime.getType(assetPath)!,
            },
          });
        } else {
          return notFound();
        }
      } catch {
        return notFound();
      }
    },
    {exact: false},
  );

  const httpServer = createHttpServer(handler);
  const stopListening = makeStoppableServer(httpServer);
  let webSocketServer: WebSocket.Server | undefined;

  return {
    async listen() {
      const port = await findPortAndListen(httpServer);
      webSocketServer = createWebSocketServer(httpServer, {resolver});
      return {port};
    },
    async close() {
      webSocketServer?.close();
      await stopListening();
    },
  };
}

function createWebSocketServer(
  httpServer: Server,
  {resolver}: {resolver: ReturnType<typeof createQueryResolver>},
) {
  const webSocketServer = new WebSocket.Server({
    server: httpServer,
    path: '/connect',
  });

  webSocketServer.on('connection', async (socket, request) => {
    const abort = new AbortController();
    const {signal} = abort;

    const forwardedProtocolHeader = request.headers['x-forwarded-proto'];
    const forwardedProtocol = Array.isArray(forwardedProtocolHeader)
      ? forwardedProtocolHeader[0]
      : forwardedProtocolHeader?.split(/\s*,\s*/)[0];

    const connectionUrl = new URL(
      request.url ?? '/',
      `${forwardedProtocol ?? 'http'}://${
        request.headers['x-forwarded-host'] ?? request.headers.host
      }`,
    );

    const expose = {
      query(
        query: string,
        {
          variables,
          signal: threadSignal,
        }: {
          signal?: ThreadAbortSignal;
          variables?: Record<string, unknown>;
        } = {},
      ) {
        const resolvedSignal = threadSignal
          ? acceptThreadAbortSignal(threadSignal)
          : new NestedAbortController(signal).signal;

        return (async function* () {
          yield* run(parse(query) as any, resolver, {
            variables,
            signal: resolvedSignal,
            context: {rootUrl: new URL('/', connectionUrl)},
          });
        })();
      },
    };

    createThread<typeof expose>(threadTargetFromWebSocket(socket), {
      expose,
      signal,
    });

    socket.once('close', () => abort.abort());
  });

  return webSocketServer;
}

async function createBuilder(
  app: LocalApp,
  {ui, outputRoot}: {ui: Ui; outputRoot: string},
): Promise<Builder> {
  const buildStateByExtension = new Map<string, BuildState>();
  const emitter = createEmitter<{
    update: {readonly extension: LocalExtension; readonly state: BuildState};
  }>();

  for (const extension of app.extensions) {
    const baseConfiguration = await createRollupConfiguration(extension, {
      mode: 'development',
    });

    const filename = `${extension.handle}.js`;

    const watcher = rollupWatch({
      ...baseConfiguration,
      output: {
        format: 'iife',
        dir: path.join(outputRoot, 'extensions'),
        entryFileNames: filename,
      },
    });

    watcher.on('event', (event) => {
      const existingState = buildStateByExtension.get(extension.id);

      switch (event.code) {
        case 'BUNDLE_START': {
          updateBuildState(extension, {
            id: (existingState?.id ?? 0) + 1,
            status: 'building',
            startedAt: Date.now(),
          });

          break;
        }
        case 'BUNDLE_END': {
          const {duration} = event;

          updateBuildState(extension, {
            id: existingState?.id ?? 1,
            status: 'success',
            duration,
            startedAt: existingState?.startedAt ?? Date.now() - duration,
          });

          break;
        }
        case 'ERROR': {
          const startedAt = existingState?.startedAt ?? Date.now();
          const {error} = event;

          updateBuildState(extension, {
            id: existingState?.id ?? 1,
            status: 'error',
            duration: Date.now() - startedAt,
            startedAt,
            errors: [{message: error.message, stack: error.stack}],
          });

          new PrintableError(
            `There was an error while trying to build your extension:`,
            {original: error},
          ).print(ui);

          break;
        }
      }
    });
  }

  return {
    outputFile(localExtension) {
      return path.join(outputRoot, 'extensions', `${localExtension.handle}.js`);
    },
    async *watch({id}, {signal} = {}) {
      const initialState = buildStateByExtension.get(id);
      if (initialState) yield initialState;

      if (signal?.aborted) return;

      for await (const {extension, state} of emitter.on('update', {signal})) {
        if (extension.id === id) yield state;
      }
    },
  };

  function updateBuildState(extension: LocalExtension, state: BuildState) {
    buildStateByExtension.set(extension.id, state);
    emitter.emit('update', {extension, state});
  }
}

function threadTargetFromWebSocket(socket: WebSocket): ThreadTarget {
  return {
    send(message) {
      socket.send(JSON.stringify(message));
    },
    async *listen({signal}) {
      const messages = on<{message: {data: WebSocket.Data}}>(
        socket,
        'message',
        {signal},
      );

      for await (const {data} of messages) {
        yield JSON.parse(data.toString());
      }
    },
  };
}
