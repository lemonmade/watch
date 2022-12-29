import {ReactNode, useState} from 'react';
import {
  useNavigate,
  useCurrentUrl,
  useSignal,
  PropsWithChildren,
  useLocalizedFormatting,
} from '@quilted/quilt';

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
  Modal,
  TextField,
  Form,
  Tag,
  InlineStack,
  View,
  List,
  ListItem,
  Icon,
} from '@lemon/zest';

import {SpoilerAvoidance} from '~/shared/spoilers';
import {Page} from '~/shared/page';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github';
import {useGoogleOAuthModal, GoogleOAuthFlow} from '~/shared/google';
import {useQuery, useMutation} from '~/shared/graphql';

import {SearchParam, PaymentStatus} from '~/global/subscriptions';

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
import redeemAccountGiftCardMutation from './graphql/RedeemAccountGiftCodeMutation.graphql';
import createAccountGiftCardMutation from './graphql/CreateAccountGiftCodeMutation.graphql';
import cancelSubscriptionMutation from './graphql/CancelSubscriptionMutation.graphql';
import prepareSubscriptionMutation, {
  type PrepareSubscriptionMutationVariables,
} from './graphql/PrepareSubscriptionMutation.graphql';

const MEMBER_COST = {amount: 3, currency: 'CAD'};
const PATRON_COST = {amount: 5, currency: 'CAD'};

export function Account() {
  const {data, refetch} = useQuery(accountQuery);

  if (data == null) return null;

  const {
    email,
    level,
    role,
    giftCode,
    subscription,
    githubAccount,
    googleAccount,
    settings,
    webAuthnCredentials,
  } = data.me;

  const handleUpdate = async () => {
    await refetch();
  };

  return (
    <Page heading="Account">
      <BlockStack spacing="huge">
        <AccountSection
          email={email}
          level={level}
          giftCode={giftCode}
          subscription={subscription}
          onUpdate={handleUpdate}
        />
        <WebAuthnSection
          credentials={webAuthnCredentials}
          onUpdate={handleUpdate}
        />
        <GoogleSection account={googleAccount} onUpdate={handleUpdate} />
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
        {role === 'ADMIN' && <AdminZone />}
      </BlockStack>
    </Page>
  );
}

function AccountSection({
  email,
  level,
  giftCode,
  subscription,
  onUpdate,
}: Pick<
  AccountQueryData.Me,
  'email' | 'level' | 'giftCode' | 'subscription'
> & {
  onUpdate(): Promise<void>;
}) {
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const signOut = useMutation(signOutMutation);

  const paymentStatus = currentUrl.searchParams.get(SearchParam.PaymentStatus);

  let paymentBanner: ReactNode = null;

  switch (paymentStatus) {
    case PaymentStatus.Success: {
      paymentBanner = (
        <Banner status="success">Your payment was successful!</Banner>
      );
      break;
    }
    case PaymentStatus.Pending: {
      paymentBanner = (
        <Banner status="information">Your payment is pending…</Banner>
      );
      break;
    }
    case PaymentStatus.Failed: {
      paymentBanner = (
        <Banner status="error">Your payment failed. Please try again</Banner>
      );
    }
  }

  let accountContent: ReactNode = null;

  if (level === 'FREE') {
    accountContent = <FreeAccountSection onUpdate={onUpdate} />;
  } else {
    accountContent = (
      <MemberAccountSection
        level={level}
        giftCode={giftCode}
        subscription={subscription}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <Section>
      <BlockStack spacing>
        <TextBlock>Email: {email}</TextBlock>
        <Action
          onPress={async () => {
            signOut.mutateAsync(
              {},
              {
                onSettled: () => navigate('/signed-out'),
              },
            );
          }}
        >
          Sign out
        </Action>

        {paymentBanner}

        {accountContent}
      </BlockStack>
    </Section>
  );
}

function FreeAccountSection({onUpdate}: {onUpdate(): Promise<void>}) {
  return (
    <BlockStack spacing>
      <BlockStack border cornerRadius padding spacing>
        <BlockStack spacing="small">
          <View>
            <Tag size="large">Free</Tag>
          </View>

          <TextBlock>
            You have a free account. You can use all the features of the app,
            with a few limits:
          </TextBlock>
        </BlockStack>

        <List>
          <ListItem>
            Track up to <Text emphasis>two seasons</Text> at a time
          </ListItem>

          <ListItem>
            Add up to <Text emphasis>five series</Text> on your watchlist
          </ListItem>

          <ListItem>
            Install up to <Text emphasis>three apps</Text>
          </ListItem>
        </List>

        <InlineStack spacing="small">
          <Action overlay={<AccountGiftCodeModal onUpdate={onUpdate} />}>
            Use gift code…
          </Action>
          <DeleteAccountAction />
        </InlineStack>
      </BlockStack>

      <SubscribeAsMember />
    </BlockStack>
  );
}

function MemberAccountSection({
  level,
  giftCode,
  subscription,
  onUpdate,
}: Pick<AccountQueryData.Me, 'level' | 'giftCode' | 'subscription'> & {
  onUpdate(): Promise<void>;
}) {
  const {formatDate, formatCurrency} = useLocalizedFormatting();

  const isPatron = level === 'PATRON';
  const cost = isPatron ? PATRON_COST : MEMBER_COST;

  return (
    <BlockStack border cornerRadius padding spacing>
      <BlockStack spacing="small">
        <InlineStack spacing="small">
          <Tag size="large">{isPatron ? 'Patron' : 'Member'}</Tag>
          {giftCode == null && (
            <Text emphasis>
              {formatCurrency(cost.amount, {
                currency: cost.currency,
              })}{' '}
              / month
            </Text>
          )}
        </InlineStack>

        {giftCode != null && (
          <InlineStack spacing="tiny">
            <Icon emphasis="subdued" source="gift" />

            <Text emphasis="subdued">
              Gift code <Text emphasis>{giftCode.code}</Text> redeemed on{' '}
              {formatDate(new Date(giftCode.redeemedAt), {dateStyle: 'short'})}
            </Text>
          </InlineStack>
        )}

        {giftCode == null && subscription?.startedAt && (
          <InlineStack spacing="tiny">
            <Icon emphasis="subdued" source="success" />

            <Text emphasis="subdued">
              Subscribed since{' '}
              {formatDate(new Date(subscription.startedAt), {
                dateStyle: 'short',
              })}
            </Text>
          </InlineStack>
        )}

        <TextBlock>
          Thank you for being a {isPatron ? 'patron' : 'member'}!
        </TextBlock>
      </BlockStack>

      <MemberBenefitsList />

      <InlineStack spacing="small">
        {giftCode == null && (
          <Action overlay={<AccountGiftCodeModal onUpdate={onUpdate} />}>
            Use gift code…
          </Action>
        )}

        {subscription?.status === 'ACTIVE' && (
          <CancelSubscriptionAction onUpdate={onUpdate} />
        )}

        <DeleteAccountAction />
      </InlineStack>
    </BlockStack>
  );
}

function DeleteAccountAction() {
  return (
    <Action role="destructive" overlay={<DeleteAccountModal />}>
      Delete…
    </Action>
  );
}

function DeleteAccountModal() {
  const navigate = useNavigate();
  const deleteAccount = useMutation(deleteAccountMutation);

  return (
    <Modal padding>
      <BlockStack spacing>
        <TextBlock>
          You won’t be able to get any of your data back once you delete your
          account.
        </TextBlock>
        <Action
          role="destructive"
          onPress={async () => {
            await deleteAccount.mutateAsync(
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
    </Modal>
  );
}

function CancelSubscriptionAction({onUpdate}: {onUpdate(): Promise<void>}) {
  return (
    <Action overlay={<CancelSubscriptionModal onUpdate={onUpdate} />}>
      Cancel…
    </Action>
  );
}

function CancelSubscriptionModal({onUpdate}: {onUpdate(): Promise<void>}) {
  const cancelSubscription = useMutation(cancelSubscriptionMutation);

  return (
    <Modal padding>
      <BlockStack spacing>
        <TextBlock>
          You will lose all membership benefits immediately. However, your
          current season watchthroughs will not be interrupted, and all your
          watch activity will be preserved.
        </TextBlock>
        <Action
          role="destructive"
          onPress={async () => {
            await cancelSubscription.mutateAsync({});
            await onUpdate();
          }}
        >
          Cancel subscription
        </Action>
      </BlockStack>
    </Modal>
  );
}

function SubscribeAsMember() {
  return (
    <SubscribeSection heading="Member" level="MEMBER" cost={MEMBER_COST}>
      <MemberBenefitsList />
    </SubscribeSection>
  );
}

function MemberBenefitsList() {
  return (
    <List>
      <ListItem>
        <Text emphasis>No limit</Text> on number of series watched
      </ListItem>

      <ListItem>
        <Text emphasis>Subscribe to series</Text> to be notified of new seasons
      </ListItem>

      <ListItem>
        <Text emphasis>Publish apps</Text> for others to use
      </ListItem>
    </List>
  );
}

function SubscribeSection({
  heading,
  cost,
  level,
  children,
}: PropsWithChildren<{
  heading: string;
  cost: {amount: number; currency: string};
  level: PrepareSubscriptionMutationVariables['level'];
}>) {
  const {formatCurrency} = useLocalizedFormatting();

  return (
    <BlockStack
      spacing
      padding
      border
      cornerRadius
      background="subdued"
      blockAlignment="spaceBetween"
    >
      <BlockStack spacing>
        <InlineStack spacing="small">
          <Tag size="large">{heading}</Tag>

          <Text emphasis>
            {formatCurrency(cost.amount, {currency: cost.currency})} / month
          </Text>
        </InlineStack>

        {children}
      </BlockStack>

      <SubscribeAction level={level}>Subscribe…</SubscribeAction>
    </BlockStack>
  );
}

function SubscribeAction({
  level,
  children,
}: PropsWithChildren<{
  level: PrepareSubscriptionMutationVariables['level'];
}>) {
  const navigate = useNavigate();
  const prepareSubscription = useMutation(prepareSubscriptionMutation);

  return (
    <Action
      to="../my/payment"
      inlineSize="fill"
      onPress={async () => {
        await prepareSubscription.mutateAsync({
          level,
        });

        navigate('../my/payment');
      }}
    >
      {children}
    </Action>
  );
}

function AccountGiftCodeModal({onUpdate}: {onUpdate(): Promise<void>}) {
  const code = useSignal('');
  const redeemAccountGiftCard = useMutation(redeemAccountGiftCardMutation);

  return (
    <Modal padding>
      <Form
        onSubmit={async () => {
          await redeemAccountGiftCard.mutateAsync({
            code: code.value,
          });

          await onUpdate();
        }}
      >
        <BlockStack spacing>
          <TextField label="Gift code" value={code} />

          <Action perform="submit">Redeem</Action>
        </BlockStack>
      </Form>
    </Modal>
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

function AdminZone() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Admin zone</Heading>
        <CreateGiftCodeSection />
      </BlockStack>
    </Section>
  );
}

function CreateGiftCodeSection() {
  const createAccountGiftCard = useMutation(createAccountGiftCardMutation);

  return (
    <BlockStack spacing>
      {createAccountGiftCard.isSuccess && (
        <Banner>
          Code:{' '}
          <Text emphasis>
            {createAccountGiftCard.data.createAccountGiftCode.code}
          </Text>
        </Banner>
      )}
      <Action
        onPress={async () => {
          await createAccountGiftCard.mutateAsync({});
        }}
      >
        Create gift code
      </Action>
    </BlockStack>
  );
}
