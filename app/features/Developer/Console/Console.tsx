import {usePerformanceNavigation, useSignal} from '@quilted/quilt';
import {
  BlockStack,
  TextField,
  Action,
  Form,
  TextBlock,
  Heading,
  Section,
  Text,
  Icon,
} from '@lemon/zest';

import {Page} from '~/shared/page';
import {
  useClipsManager,
  useLocalDevelopmentServerQuery,
  type ClipsLocalDevelopmentServer,
} from '~/shared/clips';

import developerConsoleQuery, {
  type DeveloperConsoleQueryData,
} from './graphql/DeveloperConsoleQuery.graphql';

export function Console() {
  const {localDevelopment} = useClipsManager();

  return (
    <Page heading="Console">
      {localDevelopment.connected.value ? (
        <ConnectedConsole server={localDevelopment} />
      ) : (
        <ConnectToConsole server={localDevelopment} />
      )}
    </Page>
  );
}

function ConnectedConsole({server}: {server: ClipsLocalDevelopmentServer}) {
  const {data, loading} = useLocalDevelopmentServerQuery(developerConsoleQuery);

  usePerformanceNavigation({state: loading ? 'loading' : 'complete'});

  return (
    <BlockStack spacing="large">
      <TextBlock>
        <Text accessibilityRole="code">{server.url.value?.href}</Text>
      </TextBlock>
      {data?.app.extensions.map((extension) => {
        if (extension.__typename !== 'ClipsExtension') return null;

        return (
          <Section key={extension.id}>
            <BlockStack spacing>
              <BlockStack spacing="small">
                <Heading>{extension.name}</Heading>
                <ExtensionBuildResult build={extension.build} />
              </BlockStack>
              <BlockStack spacing="small">
                {extension.extends.map(({target, conditions, preview}) => {
                  return (
                    <Action
                      to={preview.url}
                      key={target}
                      detail={<Icon source="arrowEnd" />}
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
                    </Action>
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

function ConnectToConsole({server}: {server: ClipsLocalDevelopmentServer}) {
  usePerformanceNavigation({state: 'complete'});

  const localUrl = useSignal('');

  const submit = async () => {
    if (!localUrl.value) return;

    const normalizedUrl = new URL('/connect', localUrl.value);
    normalizedUrl.protocol = normalizedUrl.protocol.replace(/^http/, 'ws');

    await server.connect(normalizedUrl);
  };

  return (
    <Form onSubmit={submit}>
      <BlockStack spacing>
        <TextField
          label="Local server URL"
          value={localUrl}
          changeTiming="input"
        />
        <Action disabled={!isValidUrl(localUrl.value)} perform="submit">
          Set local URL
        </Action>
      </BlockStack>
    </Form>
  );
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
