import {useState} from 'react';
import {useNavigate, useCurrentUrl} from '@quilted/quilt';

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

import {Page, SpoilerAvoidance} from 'components';
import {useGithubOAuthModal, GithubOAuthFlow} from 'utilities/github';
import {useQuery, useMutation} from 'utilities/graphql';

import accountQuery from './graphql/AccountQuery.graphql';
import type {AccountQueryData} from './graphql/AccountQuery.graphql';
import signOutMutation from './graphql/SignOutMutation.graphql';
import deleteAccountMutation from './graphql/DeleteAccountMutation.graphql';
import disconnectGithubAccountMutation from './graphql/DisconnectGithubAccountMutation.graphql';
import updateAccountSpoilerAvoidanceMutation from './graphql/UpdateAccountSpoilerAvoidanceMutation.graphql';

export function Account() {
  const navigate = useNavigate();
  const {data, refetch} = useQuery(accountQuery);
  const signOut = useMutation(signOutMutation);
  const deleteAccount = useMutation(deleteAccountMutation);
  const updateAccountSpoilerAvoidance = useMutation(
    updateAccountSpoilerAvoidanceMutation,
    {
      onSettled: () => refetch(),
    },
  );

  if (data == null) return null;

  const {email, githubAccount, settings} = data.me;

  return (
    <Page heading="Account">
      <BlockStack>
        <TextBlock>Email: {email}</TextBlock>
        <Button
          onPress={() => {
            signOut.mutate(
              {},
              {
                onSettled: () => navigate('/signed-out'),
              },
            );
          }}
        >
          Sign out
        </Button>
        <Section>
          <BlockStack>
            <Heading>Settings</Heading>
            <SpoilerAvoidance
              value={settings.spoilerAvoidance}
              onChange={(spoilerAvoidance) => {
                updateAccountSpoilerAvoidance.mutate({spoilerAvoidance});
              }}
            />
          </BlockStack>
        </Section>
        <GithubSection
          account={githubAccount ?? undefined}
          onConnectionChange={() => {
            refetch();
          }}
        />
        <Section>
          <BlockStack>
            <Heading>Danger zone</Heading>
            <Button
              onPress={async () => {
                deleteAccount.mutate(
                  {},
                  {
                    onSuccess: () => navigate('/goodbye'),
                  },
                );
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
          onPress={() => {
            disconnectAccount.mutate(
              {},
              {
                onSettled: () => onConnectionChange(),
              },
            );
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
