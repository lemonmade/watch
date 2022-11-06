import {useState} from 'react';
import {useNavigate, useCurrentUrl, useSignal} from '@quilted/quilt';

import {
  Heading,
  TextBlock,
  BlockStack,
  Action,
  Section,
  Text,
  Banner,
  Layout,
  Menu,
  Popover,
} from '@lemon/zest';

import {SpoilerAvoidance} from '~/shared/spoilers';
import {Page} from '~/shared/page';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github';
import {useGoogleOAuthModal, GoogleOAuthFlow} from '~/shared/google';
import {useQuery, useMutation} from '~/shared/graphql';

import accountQuery, {
  type AccountQueryData,
} from './graphql/AccountQuery.graphql';
import signOutMutation from './graphql/SignOutMutation.graphql';
import deleteAccountMutation from './graphql/DeleteAccountMutation.graphql';
import disconnectGithubAccountMutation from './graphql/DisconnectGithubAccountMutation.graphql';
import disconnectGoogleAccountMutation from './graphql/DisconnectGoogleAccountMutation.graphql';
import updateAccountSpoilerAvoidanceMutation from './graphql/UpdateAccountSpoilerAvoidanceMutation.graphql';
import startWebAuthnRegistrationMutation from './graphql/StartWebAuthnRegistrationMutation.graphql';
import createWebAuthnCredentialMutation from './graphql/CreateWebAuthnCredentialMutation.graphql';
import deleteWebAuthnCredentialMutation from './graphql/DeleteWebAuthnCredentialMutation.graphql';

export function Account() {
  const navigate = useNavigate();
  const {data, refetch} = useQuery(accountQuery);
  const signOut = useMutation(signOutMutation);

  if (data == null) return null;

  const {email, githubAccount, googleAccount, settings, webAuthnCredentials} =
    data.me;

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
        <WebAuthnSection
          credentials={webAuthnCredentials}
          onUpdate={async () => {
            await refetch();
          }}
        />
        <GoogleSection
          account={googleAccount}
          onUpdate={async () => {
            await refetch();
          }}
        />
        <GithubSection
          account={githubAccount ?? undefined}
          onConnectionChange={() => {
            refetch();
          }}
        />
        <SpoilerAvoidanceSection
          spoilerAvoidance={settings.spoilerAvoidance}
          refetch={refetch}
        />
        <DangerZone />
      </BlockStack>
    </Page>
  );
}

function WebAuthnSection({
  credentials,
  onUpdate,
}: {
  credentials: AccountQueryData.Me['webAuthnCredentials'];
  onUpdate(): Promise<void>;
}) {
  const startWebAuthnRegistration = useMutation(
    startWebAuthnRegistrationMutation,
  );
  const createWebAuthnCredential = useMutation(
    createWebAuthnCredentialMutation,
  );

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>WebAuthn</Heading>

        {credentials.length > 0 && (
          <BlockStack spacing>
            {credentials.map((credential) => (
              <WebAuthnCredential
                key={credential.id}
                credential={credential}
                onUpdate={onUpdate}
              />
            ))}
          </BlockStack>
        )}

        <TextBlock>Connect a WebAuthn authenticator</TextBlock>
        <Action
          onPress={async () => {
            const [{startRegistration}, result] = await Promise.all([
              import('@simplewebauthn/browser'),
              startWebAuthnRegistration.mutateAsync({}),
            ]);

            const registrationOptions = JSON.parse(
              result.startWebAuthnRegistration.result,
            );

            const registrationResult = await startRegistration(
              registrationOptions,
            );

            await createWebAuthnCredential.mutateAsync({
              credential: JSON.stringify(registrationResult),
            });

            await onUpdate();
          }}
        >
          Connect
        </Action>
      </BlockStack>
    </Section>
  );
}

interface WebAuthnCredentialProps {
  credential: AccountQueryData.Me.WebAuthnCredentials;
  onUpdate(): Promise<void>;
}

function WebAuthnCredential(props: WebAuthnCredentialProps) {
  const {id} = props.credential;

  return (
    <Layout spacing columns={['fill', 'auto']}>
      <Text>{id}</Text>
      <Action overlay={<WebAuthnCredentialManageMenu {...props} />}>
        Manage
      </Action>
    </Layout>
  );
}

function WebAuthnCredentialManageMenu({
  credential: {id},
  onUpdate,
}: WebAuthnCredentialProps) {
  const deleteWebAuthnCredential = useMutation(
    deleteWebAuthnCredentialMutation,
  );

  return (
    <Popover>
      <Menu>
        <Action
          icon="delete"
          role="destructive"
          onPress={async () => {
            await deleteWebAuthnCredential.mutateAsync({id});
            await onUpdate();
          }}
        >
          Delete
        </Action>
      </Menu>
    </Popover>
  );
}

function GoogleSection({
  account,
  onUpdate,
}: {
  account?: AccountQueryData.Me.GoogleAccount | null;
  onUpdate(): Promise<void>;
}) {
  const disconnectAccount = useMutation(disconnectGoogleAccountMutation);

  if (account == null) {
    return <ConnectGoogleAccount onUpdate={onUpdate} />;
  }

  const {email} = account;

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Google account</Heading>
        <TextBlock>username: {email}</TextBlock>
        <Action
          onPress={async () => {
            await disconnectAccount.mutateAsync({});
            await onUpdate();
          }}
        >
          Disconnect
        </Action>
      </BlockStack>
    </Section>
  );
}

function ConnectGoogleAccount({onUpdate}: {onUpdate(): Promise<void>}) {
  const currentUrl = useCurrentUrl();
  const [error, setError] = useState(false);

  const open = useGoogleOAuthModal(GoogleOAuthFlow.Connect, (event) => {
    setError(!event.success);
    if (event.success) onUpdate();
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
        <Heading divider>Google account</Heading>
        <TextBlock>
          Connecting your Google account lets you sign in with Google.
        </TextBlock>
        <Action
          onPress={() => {
            setError(false);
            open({redirectTo: currentUrl.href});
          }}
        >
          Connect Google
        </Action>
      </BlockStack>
    </Section>
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

function DangerZone() {
  const navigate = useNavigate();
  const deleteAccount = useMutation(deleteAccountMutation);

  return (
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
  );
}
