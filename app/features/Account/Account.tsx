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
import {useSignal} from '@watching/react-signals';

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

  if (data == null) return null;

  const {email, githubAccount, settings} = data.me;

  return (
    <Page heading="Account">
      <BlockStack spacing="huge">
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
        </BlockStack>
        <SpoilerAvoidanceSection
          spoilerAvoidance={settings.spoilerAvoidance}
          refetch={refetch}
        />
        <GithubSection
          account={githubAccount ?? undefined}
          onConnectionChange={() => {
            refetch();
          }}
        />
        <Section>
          <BlockStack spacing>
            <Heading divider>Danger zone</Heading>
            <Action
              role="destructive"
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
        <Heading divider>Github account</Heading>
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

function SpoilerAvoidanceSection({
  spoilerAvoidance,
  refetch,
}: {
  spoilerAvoidance: AccountQueryData.Me.Settings['spoilerAvoidance'];
  refetch(): Promise<any>;
}) {
  const spoilerAvoidanceSignal = useSignal(spoilerAvoidance, [
    spoilerAvoidance,
  ]);

  const updateAccountSpoilerAvoidance = useMutation(
    updateAccountSpoilerAvoidanceMutation,
  );

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Settings</Heading>
        <SpoilerAvoidance
          value={spoilerAvoidanceSignal}
          onChange={(spoilerAvoidance) => {
            spoilerAvoidanceSignal.value = spoilerAvoidance;
            updateAccountSpoilerAvoidance.mutate(
              {spoilerAvoidance},
              {
                onSettled: () => refetch(),
              },
            );
          }}
        />
      </BlockStack>
    </Section>
  );
}
