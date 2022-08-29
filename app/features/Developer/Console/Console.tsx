import {useState} from 'react';

import {useCurrentUrl} from '@quilted/quilt';
import {
  BlockStack,
  TextField,
  Button,
  Form,
  TextBlock,
  Heading,
  Section,
  Link,
  Text,
  Icon,
} from '@lemon/zest';

import {Page} from '~/components';
import {
  useLocalDevelopmentServer,
  useLocalDevelopmentServerQuery,
  type LocalDevelopmentServer,
} from '~/shared/clips';

import developerConsoleQuery, {
  type DeveloperConsoleQueryData,
} from './graphql/DeveloperConsoleQuery.graphql';

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
  const {data} = useLocalDevelopmentServerQuery(developerConsoleQuery);

  return (
    <BlockStack spacing="large">
      <TextBlock>
        <Text accessibilityRole="code">{server.url.href}</Text>
      </TextBlock>
      {data?.app.extensions.map((extension) => {
        if (extension.__typename !== 'ClipsExtension') return null;

        return (
          <Section key={extension.id}>
            <BlockStack>
              <BlockStack spacing="small">
                <Heading>{extension.name}</Heading>
                <ExtensionBuildResult build={extension.build} />
              </BlockStack>
              <BlockStack spacing="small">
                {extension.extends.map(({target, conditions, preview}) => {
                  return (
                    <Link
                      to={preview.url}
                      key={target}
                      padding="small"
                      border="base"
                      cornerRadius={4}
                      background="#222"
                      accessory={<Icon source="arrowEnd" />}
                    >
                      <BlockStack spacing="tiny">
                        <Text accessibilityRole="code">
                          {target
                            .split('.')
                            .join('.' + String.fromCharCode(8203))}
                        </Text>
                        {conditions.length > 0 &&
                          conditions.map(({series}) => {
                            if (series == null) return null;
                            return (
                              <TextBlock key={`series:${series.handle}`}>
                                <Text emphasis="subdued">Series: </Text>
                                <Text emphasis="strong">{series.handle}</Text>
                              </TextBlock>
                            );
                          })}
                      </BlockStack>
                    </Link>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Section>
        );
      })}
    </BlockStack>
  );
}

function ExtensionBuildResult({
  build,
}: {
  build: DeveloperConsoleQueryData.App.Extensions_ClipsExtension.Build;
}) {
  switch (build.__typename) {
    case 'ExtensionBuildSuccess': {
      return <TextBlock>Build succeeded in {build.duration}ms</TextBlock>;
    }
    case 'ExtensionBuildInProgress': {
      return <TextBlock>Build in progress</TextBlock>;
    }
    case 'ExtensionBuildError': {
      return (
        <TextBlock>
          Build failed in {build.duration}ms: {build.error}
        </TextBlock>
      );
    }
    default: {
      return null;
    }
  }
}

function ConnectToConsole() {
  const currentUrl = useCurrentUrl();
  const [localUrl, setLocalUrl] = useState<string>('');

  const submit = () => {
    if (!localUrl) return;

    const normalizedUrl = new URL('/connect', localUrl);
    normalizedUrl.protocol = normalizedUrl.protocol.replace(/^http/, 'ws');

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
