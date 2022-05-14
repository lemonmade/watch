import {useEffect, useState} from 'react';
// import type {ReactNode} from 'react';

import {useCurrentUrl} from '@quilted/quilt';
import {BlockStack, TextField, Button, Form, TextBlock} from '@lemon/zest';

import {Page} from 'components';
import {useLocalDevelopmentServer} from 'utilities/clips';
import type {LocalDevelopmentServer} from 'utilities/clips';

import developerConsoleQuery from './graphql/DeveloperConsoleQuery.graphql';

export function Console() {
  const developmentServer = useLocalDevelopmentServer({required: false});

  return (
    <Page heading="Console">
      {developmentServer ? (
        <ConnectedConsole server={developmentServer} />
      ) : (
        <ConnectToConsole />
      )}
    </Page>
  );
}

function ConnectedConsole({server}: {server: LocalDevelopmentServer}) {
  const [data, setData] = useState<any>();

  useEffect(() => {
    const abort = new AbortController();

    (async () => {
      for await (const result of server.query(developerConsoleQuery, {
        signal: abort.signal,
      })) {
        setData(result);
      }
    })();

    return () => {
      abort.abort();
    };
  }, [server]);

  return (
    <BlockStack>
      <TextBlock>Connected to: {server.url.href}</TextBlock>
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
