import {useState} from 'react';
import {useNavigate, useCurrentUrl} from '@quilted/quilt';

import {
  Heading,
  TextBlock,
  BlockStack,
  Action,
  Section,
  Text,
  Banner,
} from '@lemon/zest';

import {SpoilerAvoidance} from '~/shared/spoilers';
import {Page} from '~/shared/page';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github';
import {useQuery, useMutation} from '~/shared/graphql';

import accountQuery, {
  type AccountQueryData,
} from './graphql/AccountQuery.graphql';
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
      <BlockStack spacing>
        <TextBlock>Email: {email}</TextBlock>
        <Action
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
        </Action>
        <Section>
          <BlockStack spacing>
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
          <BlockStack spacing>
            <Heading>Danger zone</Heading>
            <Action
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
            </Action>
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
      <BlockStack spacing>
        <Heading>Github account</Heading>
        <TextBlock>username: {username}</TextBlock>
        <Action to={profileUrl} target="new">
          Visit profile
        </Action>
        <Action
          onPress={() => {
            disconnectAccount.mutate(
              {},
              {
                onSettled: () => onConnectionChange(),
              },
            );
          }}
        >
          <Text>
            Disconnect <Text emphasis="strong">{username}</Text>
          </Text>
        </Action>
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
      <BlockStack spacing>
        {errorContent}
        <Heading>Github account</Heading>
        <TextBlock>
          Connecting your Github account lets you sign in with Github.
        </TextBlock>
        <Action
          onPress={() => {
            setError(false);
            open({redirectTo: currentUrl.href});
          }}
        >
          Connect Github
        </Action>
      </BlockStack>
    </Section>
  );
}
