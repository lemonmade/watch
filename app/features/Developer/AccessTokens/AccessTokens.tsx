import {useState} from 'react';
import type {ReactNode} from 'react';
import {useQuery, useMutation} from '@quilted/quilt';
import {BlockStack, TextBlock, Button, Banner, Text, Layout} from '@lemon/zest';

import {Page} from 'components';

import accessTokensQuery from './graphql/AccessTokensQuery.graphql';
import createAccessTokenMutation from './graphql/CreateAccessTokenMutation.graphql';
import deleteAccessTokenMutation from './graphql/DeleteAccessTokenMutation.graphql';

export function AccessTokens() {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const [createResult, setCreateResult] = useState<{
    type: 'error' | 'success';
    message: ReactNode;
  }>();

  const {data} = useQuery(accessTokensQuery, {variables: {key} as any});
  const createAccessToken = useMutation(createAccessTokenMutation);
  const deleteAccessToken = useMutation(deleteAccessTokenMutation);

  const accessTokens =
    (data?.me.accessTokens.length ?? 0) === 0 ? (
      <TextBlock>No personal access tokens</TextBlock>
    ) : (
      data!.me.accessTokens.map((accessToken) => (
        <Layout sizes={['fill', 'auto']} key={accessToken.id}>
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
          <Button
            onPress={async () => {
              await deleteAccessToken({variables: {id: accessToken.id}});
              setKey((key) => key + 1);
            }}
          >
            Delete
          </Button>
        </Layout>
      ))
    );

  return (
    <Page heading="Access tokens">
      <BlockStack>
        {createResult == null ? null : (
          <Banner
            status={createResult.type === 'error' ? 'error' : 'information'}
          >
            {createResult.message}
          </Banner>
        )}
        {accessTokens}
        <Button
          loading={loading}
          onPress={async () => {
            setCreateResult(undefined);
            setLoading(true);

            const {data} = await createAccessToken();

            if (data?.createPersonalAccessToken?.plaintextToken == null) {
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
                      {data.createPersonalAccessToken.plaintextToken}
                    </Text>
                    . Make sure you copy it now, because you won’t be able to
                    see it again!
                  </>
                ),
              });
            }

            setLoading(false);
            setKey((key) => key + 1);
          }}
        >
          Create access token
        </Button>
      </BlockStack>
    </Page>
  );
}
