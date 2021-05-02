import {useState} from 'react';
import {
  useQuery,
  useMutation,
  useNavigate,
  useCurrentUrl,
} from '@quilted/quilt';
import {NotFound} from '@quilted/quilt/http';

import {
  Heading,
  TextBlock,
  BlockStack,
  Button,
  Section,
  Link,
  Text,
  Banner,
} from '@lemon/zest';

import {Page} from 'components';
import {useGithubOAuthModal, GithubOAuthFlow} from 'utilities/github';

import accountQuery from './graphql/AccountQuery.graphql';
import type {AccountQueryData} from './graphql/AccountQuery.graphql';
import signOutMutation from './graphql/SignOutMutation.graphql';
import deleteAccountMutation from './graphql/DeleteAccountMutation.graphql';
import disconnectGithubAccountMutation from './graphql/DisconnectGithubAccountMutation.graphql';

export function Account() {
  const [key, setKey] = useState(1);

  const navigate = useNavigate();
  const {data} = useQuery(accountQuery, {
    variables: {key} as any,
    cache: false,
  });
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
          onConnectionChange={() => {
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
  onConnectionChange,
}: {
  account?: AccountQueryData.Me.GithubAccount;
  onConnectionChange(): void;
}) {
  const disconnectAccount = useMutation(disconnectGithubAccountMutation);

  if (account == null) {
    return <ConnectGithubAccount onConnectionChange={onConnectionChange} />;
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
            onConnectionChange();
          }}
        >
          Disconnect <Text emphasis="strong">{username}</Text>
        </Button>
      </BlockStack>
    </Section>
  );
}

function ConnectGithubAccount({
  onConnectionChange,
}: {
  onConnectionChange?(): void;
}) {
  const currentUrl = useCurrentUrl();
  const [error, setError] = useState(false);

  const open = useGithubOAuthModal(GithubOAuthFlow.Connect, (event) => {
    setError(!event.success);
    if (event.success) onConnectionChange?.();
  });

  const errorContent = error ? (
    <Banner status="error">
      There was an error connecting your Github account. You’ll need to try
      again.
    </Banner>
  ) : null;

  return (
    <Section>
      <BlockStack>
        {errorContent}
        <Heading>Github account</Heading>
        <TextBlock>
          Connecting your Github account lets you sign in with Github.
        </TextBlock>
        <Button
          onPress={() => {
            setError(false);
            open({redirectTo: currentUrl.href});
          }}
        >
          Connect Github
        </Button>
      </BlockStack>
    </Section>
  );
}
