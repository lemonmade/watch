import {useState, type ReactNode} from 'react';
import {usePerformanceNavigation} from '@quilted/quilt';
import {BlockStack, TextBlock, Action, Banner, Text, Layout} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {useQuery, useMutation} from '~/shared/graphql.ts';

import accessTokensQuery from './graphql/AccessTokensQuery.graphql';
import createAccessTokenMutation from './graphql/CreateAccessTokenMutation.graphql';
import deleteAccessTokenMutation from './graphql/DeleteAccessTokenMutation.graphql';

export default function AccessTokens() {
  const [createResult, setCreateResult] = useState<{
    type: 'error' | 'success';
    message: ReactNode;
  }>();

  const {data, refetch, isLoading} = useQuery(accessTokensQuery);

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  const createAccessToken = useMutation(createAccessTokenMutation, {
    onSettled: () => refetch(),
    onMutate: () => setCreateResult(undefined),
    onSuccess: (data) => {
      if (data?.createPersonalAccessToken?.plaintextToken == null) {
        setCreateResult({
          type: 'error',
          message: 'Failed to create access token, please try again later.',
        });
      } else {
        setCreateResult({
          type: 'success',
          message: (
            <>
              Your new access token is{' '}
              <Text emphasis="strong">
                {data.createPersonalAccessToken.plaintextToken}
              </Text>
              . Make sure you copy it now, because you won’t be able to see it
              again!
            </>
          ),
        });
      }
    },
  });
  const deleteAccessToken = useMutation(deleteAccessTokenMutation, {
    onSettled: () => refetch(),
  });

  const accessTokens =
    (data?.me.accessTokens.length ?? 0) === 0 ? (
      <TextBlock>No personal access tokens</TextBlock>
    ) : (
      data!.me.accessTokens.map((accessToken) => (
        <Layout columns={['fill', 'auto']} key={accessToken.id}>
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
              await deleteAccessToken.mutateAsync({id: accessToken.id});
            }}
          >
            Delete
          </Action>
        </Layout>
      ))
    );

  return (
    <Page heading="Access tokens">
      <BlockStack spacing>
        {createResult == null ? null : (
          <Banner
            status={createResult.type === 'error' ? 'error' : 'information'}
          >
            {createResult.message}
          </Banner>
        )}
        {accessTokens}
        <Action
          loading={createAccessToken.isLoading}
          onPress={() => {
            createAccessToken.mutate({});
          }}
        >
          Create access token
        </Action>
      </BlockStack>
    </Page>
  );
}
