import {useState} from 'preact/hooks';
import type {ComponentChild} from 'preact';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {
  BlockStack,
  TextBlock,
  Action,
  Banner,
  Text,
  InlineGrid,
} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {
  useGraphQLQuery,
  useGraphQLMutation,
  useGraphQLQueryRefetchOnMount,
  useGraphQLQueryData,
} from '~/shared/graphql.ts';

import accessTokensQuery from './graphql/AccessTokensQuery.graphql';
import createAccessTokenMutation from './graphql/CreateAccessTokenMutation.graphql';
import deleteAccessTokenMutation from './graphql/DeleteAccessTokenMutation.graphql';

export default function AccessTokens() {
  const [createResult, setCreateResult] = useState<{
    type: 'error' | 'success';
    message: ComponentChild;
  }>();

  const query = useGraphQLQuery(accessTokensQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {me} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  const createAccessToken = useGraphQLMutation(createAccessTokenMutation);
  const deleteAccessToken = useGraphQLMutation(deleteAccessTokenMutation);

  const accessTokens =
    me.accessTokens.length === 0 ? (
      <TextBlock>No personal access tokens</TextBlock>
    ) : (
      me.accessTokens.map((accessToken) => (
        <InlineGrid sizes={['fill', 'auto']} key={accessToken.id}>
          <BlockStack spacing="small">
            <Text>
              {accessToken.prefix}
              {'*'.repeat(
                accessToken.length - accessToken.lastFourCharacters.length - 4,
              )}
              {accessToken.lastFourCharacters}
            </Text>
            {accessToken.label ? <Text>{accessToken.label}</Text> : null}
            <Text emphasis="subdued">
              Created at: {new Date(accessToken.createdAt).toLocaleString()}
            </Text>
            <Text emphasis="subdued">
              Last used:{' '}
              {accessToken.lastUsedAt
                ? new Date(accessToken.lastUsedAt).toLocaleString()
                : 'never'}
            </Text>
          </BlockStack>
          <Action
            onPress={async () => {
              await deleteAccessToken.run({id: accessToken.id});
              await query.rerun();
            }}
          >
            Delete
          </Action>
        </InlineGrid>
      ))
    );

  return (
    <Page heading="Access tokens">
      <BlockStack spacing>
        {createResult == null ? null : (
          <Banner
            tone={createResult.type === 'error' ? 'critical' : 'positive'}
          >
            {createResult.message}
          </Banner>
        )}
        {accessTokens}
        <Action
          onPress={async () => {
            setCreateResult(undefined);
            const result = await createAccessToken.run();

            if (result.data) {
              if (
                result.data.createPersonalAccessToken?.plaintextToken == null
              ) {
                setCreateResult({
                  type: 'error',
                  message:
                    'Failed to create access token, please try again later.',
                });
              } else {
                setCreateResult({
                  type: 'success',
                  message: (
                    <>
                      Your new access token is{' '}
                      <Text emphasis="strong">
                        {result.data.createPersonalAccessToken.plaintextToken}
                      </Text>
                      . Make sure you copy it now, because you won’t be able to
                      see it again!
                    </>
                  ),
                });
              }
            }

            await query.rerun();
          }}
        >
          Create access token
        </Action>
      </BlockStack>
    </Page>
  );
}
