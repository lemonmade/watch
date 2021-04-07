import {useState} from 'react';
import {useQuery, useMutation, useNavigate} from '@quilted/quilt';
import {NotFound} from '@quilted/quilt/http';

import {
  Heading,
  TextBlock,
  BlockStack,
  Button,
  Section,
  Link,
  Text,
} from '@lemon/zest';

import {Page} from 'components';

import accountQuery from './graphql/AccountQuery.graphql';
import type {AccountQueryData} from './graphql/AccountQuery.graphql';
import signOutMutation from './graphql/SignOutMutation.graphql';
import deleteAccountMutation from './graphql/DeleteAccountMutation.graphql';
import disconnectGithubAccountMutation from './graphql/DisconnectGithubAccountMutation.graphql';

export function Account() {
  const [key, setKey] = useState(1);

  const navigate = useNavigate();
  const {data} = useQuery(accountQuery, {variables: {key} as any});
  const signOut = useMutation(signOutMutation);
  const deleteAccount = useMutation(deleteAccountMutation);

  if (data == null) return <NotFound />;

  const {email, githubAccount} = data.me;

  return (
    <Page heading="Account">
      <BlockStack>
        <TextBlock>Email: {email}</TextBlock>
        <Button
          onPress={async () => {
            await signOut();
            navigate('/signed-out');
          }}
        >
          Sign out
        </Button>
        <GithubSection
          account={githubAccount ?? undefined}
          onDisconnectAccount={() => {
            setKey((key) => key + 1);
          }}
        />
        <Section>
          <BlockStack>
            <Heading>Danger zone</Heading>
            <Button
              onPress={async () => {
                await deleteAccount();
                navigate('/goodbye');
              }}
            >
              Delete account
            </Button>
          </BlockStack>
        </Section>
      </BlockStack>
    </Page>
  );
}

function GithubSection({
  account,
  onDisconnectAccount,
}: {
  account?: AccountQueryData.Me.GithubAccount;
  onDisconnectAccount(): void;
}) {
  const disconnectAccount = useMutation(disconnectGithubAccountMutation);

  if (account == null) {
    return (
      <Section>
        <BlockStack>
          <Heading>Github account</Heading>
          <TextBlock>
            Connecting your Github account lets you sign in with Github
          </TextBlock>
          <Link
            to={(currentUrl) => {
              const target = new URL(
                '/internal/auth/github/connect',
                currentUrl,
              );
              target.searchParams.set('redirect', currentUrl.pathname);
              return target;
            }}
          >
            Connect Github
          </Link>
        </BlockStack>
      </Section>
    );
  }

  const {username, profileUrl} = account;

  return (
    <Section>
      <BlockStack>
        <Heading>Github account</Heading>
        <TextBlock>username: {username}</TextBlock>
        <Link to={profileUrl} target="newTab">
          Visit profile
        </Link>
        <Button
          onPress={async () => {
            await disconnectAccount();
            onDisconnectAccount();
          }}
        >
          Disconnect <Text emphasis="strong">{username}</Text>
        </Button>
      </BlockStack>
    </Section>
  );
}
