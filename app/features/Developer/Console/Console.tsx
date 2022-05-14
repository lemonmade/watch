import {useEffect, useState} from 'react';
// import type {ReactNode} from 'react';

import {GraphQLOperation, useCurrentUrl} from '@quilted/quilt';
import {BlockStack, TextField, Button, Form, TextBlock} from '@lemon/zest';
import {
  createThread,
  createThreadAbortSignal,
  targetFromBrowserWebSocket,
} from '@lemonmade/threads';
import type {ThreadAbortSignal} from '@lemonmade/threads';

import {Page} from 'components';

import developerConsoleQuery from './graphql/DeveloperConsoleQuery.graphql';

export function Console() {
  const currentUrl = useCurrentUrl();
  const connectParam = currentUrl.searchParams.get('connect');

  return (
    <Page heading="Console">
      {connectParam ? (
        <ConnectedConsole connect={connectParam} />
      ) : (
        <ConnectToConsole />
      )}
    </Page>
  );
}

function ConnectedConsole({connect}: {connect: string}) {
  const [data, setData] = useState<any>();

  useEffect(() => {
    const abort = new AbortController();

    const socket = new WebSocket(connect);
    const target = targetFromBrowserWebSocket(socket);
    const thread = createThread<
      Record<string, never>,
      {
        query<Data = Record<string, unknown>>(
          query: string,
          options?: {signal?: ThreadAbortSignal},
        ): AsyncGenerator<Data, void, void>;
      }
    >(target);

    abort.signal.addEventListener(
      'abort',
      () => {
        thread.terminate();
        socket.close();
      },
      {once: true},
    );

    async function* query<Data>(
      query: GraphQLOperation<Data, any>,
      {signal}: {signal?: AbortSignal} = {},
    ) {
      const results = thread.call.query(query.source, {
        signal: signal && createThreadAbortSignal(signal),
      }) as AsyncGenerator<{
        data?: Data;
      }>;

      for await (const result of results) {
        yield result;
      }
    }

    (async () => {
      for await (const result of query(developerConsoleQuery, {
        signal: abort.signal,
      })) {
        setData(result);
      }
    })();

    return () => {
      abort.abort();
    };
  }, [connect]);

  return (
    <BlockStack>
      <TextBlock>Connected to: {connect}</TextBlock>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </BlockStack>
  );
}

function ConnectToConsole() {
  const currentUrl = useCurrentUrl();
  const [localUrl, setLocalUrl] = useState<string>('');

  const submit = () => {
    if (!localUrl) return;

    const normalizedUrl = new URL('/connect', localUrl);
    normalizedUrl.protocol = 'ws:';

    const targetUrl = new URL(currentUrl);
    targetUrl.searchParams.set('connect', normalizedUrl.href);

    window.location.assign(targetUrl.href);
  };

  return (
    <Form onSubmit={submit}>
      <BlockStack>
        <TextField
          label="Local server URL"
          onChange={(value) => {
            setLocalUrl(value);
          }}
        />
        <Button disabled={!localUrl} onPress={submit}>
          Set local URL
        </Button>
      </BlockStack>
    </Form>
  );
}
