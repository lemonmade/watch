import type {ComponentChild, RenderableProps} from 'preact';
import {useState} from 'preact/hooks';
import {useSignal} from '@quilted/quilt/signals';
import {useNavigate, useCurrentURL} from '@quilted/quilt/navigation';
import {useLocalizedFormatting} from '@quilted/quilt/localize';
import {usePerformanceNavigation} from '@quilted/quilt/performance';

import {
  Heading,
  TextBlock,
  BlockStack,
  Button,
  Section,
  Text,
  Banner,
  InlineGrid,
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

import {SpoilerAvoidance} from '~/shared/spoilers.ts';
import {Page} from '~/shared/page.ts';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github.ts';
import {useGoogleOAuthModal, GoogleOAuthFlow} from '~/shared/google.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryRefetchOnMount,
  useGraphQLQueryData,
  useGraphQLMutation,
} from '~/shared/graphql.ts';
import {SignInWithAppleButton} from '~/shared/auth.ts';

import {SearchParam, PaymentStatus} from '~/global/subscriptions.ts';

import accountQuery, {
  type AccountQueryData,
} from './graphql/AccountQuery.graphql';
import signOutMutation from './graphql/SignOutMutation.graphql';
import deleteAccountMutation from './graphql/DeleteAccountMutation.graphql';
import disconnectGithubAccountMutation from './graphql/DisconnectGithubAccountMutation.graphql';
import disconnectGoogleAccountMutation from './graphql/DisconnectGoogleAccountMutation.graphql';
import updateAccountSpoilerAvoidanceMutation from './graphql/UpdateAccountSpoilerAvoidanceMutation.graphql';
import startPasskeyCreateMutation from './graphql/StartPasskeyCreateMutation.graphql';
import finishPasskeyCreateMutation from './graphql/FinishPasskeyCreateMutation.graphql';
import deletePasskeyMutation from './graphql/DeletePasskeyMutation.graphql';
import redeemAccountGiftCardMutation from './graphql/RedeemAccountGiftCodeMutation.graphql';
import cancelSubscriptionMutation from './graphql/CancelSubscriptionMutation.graphql';
import prepareSubscriptionMutation, {
  type PrepareSubscriptionMutationVariables,
} from './graphql/PrepareSubscriptionMutation.graphql';
import connectAppleAccountMutation from './graphql/ConnectAppleAccountMutation.graphql';
import disconnectAppleAccountMutation from './graphql/DisconnectAppleAccountMutation.graphql';

const MEMBER_COST = {amount: 3, currency: 'CAD'};
const PATRON_COST = {amount: 5, currency: 'CAD'};

export default function Account() {
  const query = useGraphQLQuery(accountQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {me} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  const {
    email,
    level,
    giftCode,
    subscription,
    appleAccount,
    githubAccount,
    googleAccount,
    settings,
    passkeys,
  } = me;

  const handleUpdate = async () => {
    await query.rerun();
  };

  return (
    <Page heading="Account">
      <BlockStack spacing="large.2">
        <AccountSection
          email={email}
          level={level}
          giftCode={giftCode}
          subscription={subscription}
          onUpdate={handleUpdate}
        />
        <PasskeySection passkeys={passkeys} onUpdate={handleUpdate} />
        <AppleSection account={appleAccount} onUpdate={handleUpdate} />
        <GoogleSection account={googleAccount} onUpdate={handleUpdate} />
        <GithubSection
          account={githubAccount ?? undefined}
          onConnectionChange={() => query.rerun()}
        />
        <SpoilerAvoidanceSection
          spoilerAvoidance={settings.spoilerAvoidance}
          refetch={() => query.rerun()}
        />
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
  const currentUrl = useCurrentURL();
  const signOut = useGraphQLMutation(signOutMutation);

  const paymentStatus = currentUrl.searchParams.get(SearchParam.PaymentStatus);

  let paymentBanner: ComponentChild = null;

  switch (paymentStatus) {
    case PaymentStatus.Success: {
      paymentBanner = (
        <Banner tone="positive">Your payment was successful!</Banner>
      );
      break;
    }
    case PaymentStatus.Pending: {
      paymentBanner = <Banner>Your payment is pending…</Banner>;
      break;
    }
    case PaymentStatus.Failed: {
      paymentBanner = (
        <Banner tone="critical">Your payment failed. Please try again</Banner>
      );
    }
  }

  let accountContent: ComponentChild = null;

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
        <Button
          onPress={async () => {
            await signOut.run();
            navigate('/signed-out');
          }}
        >
          Sign out
        </Button>

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
          <Button overlay={<AccountGiftCodeModal onUpdate={onUpdate} />}>
            Use gift code…
          </Button>
          <DeleteAccountButton />
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
          <InlineStack spacing="small.2">
            <Icon emphasis="subdued" source="gift" />

            <Text emphasis="subdued">
              Gift code <Text emphasis>{giftCode.code}</Text> redeemed on{' '}
              {formatDate(new Date(giftCode.redeemedAt!), {dateStyle: 'short'})}
            </Text>
          </InlineStack>
        )}

        {giftCode == null && subscription?.startedAt && (
          <InlineStack spacing="small.2">
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
          <Button overlay={<AccountGiftCodeModal onUpdate={onUpdate} />}>
            Use gift code…
          </Button>
        )}

        {subscription?.status === 'ACTIVE' && (
          <CancelSubscriptionButton onUpdate={onUpdate} />
        )}

        <DeleteAccountButton />
      </InlineStack>
    </BlockStack>
  );
}

function DeleteAccountButton() {
  return (
    <Button role="destructive" overlay={<DeleteAccountModal />}>
      Delete…
    </Button>
  );
}

function DeleteAccountModal() {
  const navigate = useNavigate();
  const deleteAccount = useGraphQLMutation(deleteAccountMutation);

  return (
    <Modal padding>
      <BlockStack spacing>
        <TextBlock>
          You won’t be able to get any of your data back once you delete your
          account.
        </TextBlock>
        <Button
          role="destructive"
          onPress={async () => {
            await deleteAccount.run();
            navigate('/goodbye');
          }}
        >
          Delete account
        </Button>
      </BlockStack>
    </Modal>
  );
}

function CancelSubscriptionButton({onUpdate}: {onUpdate(): Promise<void>}) {
  return (
    <Button overlay={<CancelSubscriptionModal onUpdate={onUpdate} />}>
      Cancel…
    </Button>
  );
}

function CancelSubscriptionModal({onUpdate}: {onUpdate(): Promise<void>}) {
  const cancelSubscription = useGraphQLMutation(cancelSubscriptionMutation);

  return (
    <Modal padding>
      <BlockStack spacing>
        <TextBlock>
          You will lose all membership benefits immediately. However, your
          current season watchthroughs will not be interrupted, and all your
          watch activity will be preserved.
        </TextBlock>
        <Button
          role="destructive"
          onPress={async () => {
            await cancelSubscription.run();
            await onUpdate();
          }}
        >
          Cancel subscription
        </Button>
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
}: RenderableProps<{
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
      blockAlignment="space-between"
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

      <SubscribeButton level={level}>Subscribe…</SubscribeButton>
    </BlockStack>
  );
}

function SubscribeButton({
  level,
  children,
}: RenderableProps<{
  level: PrepareSubscriptionMutationVariables['level'];
}>) {
  const navigate = useNavigate();
  const prepareSubscription = useGraphQLMutation(prepareSubscriptionMutation);

  return (
    <Button
      to="../my/payment"
      inlineSize="fill"
      onPress={async () => {
        await prepareSubscription.run({
          level,
        });

        navigate('../my/payment');
      }}
    >
      {children}
    </Button>
  );
}

function AccountGiftCodeModal({onUpdate}: {onUpdate(): Promise<void>}) {
  const code = useSignal('');
  const redeemAccountGiftCard = useGraphQLMutation(
    redeemAccountGiftCardMutation,
  );

  return (
    <Modal padding>
      <Form
        onSubmit={async () => {
          await redeemAccountGiftCard.run({
            code: code.value,
          });

          await onUpdate();
        }}
      >
        <BlockStack spacing>
          <TextField label="Gift code" value={code} />

          <Button perform="submit">Redeem</Button>
        </BlockStack>
      </Form>
    </Modal>
  );
}

function PasskeySection({
  passkeys,
  onUpdate,
}: {
  passkeys: AccountQueryData.Me['passkeys'];
  onUpdate(): Promise<void>;
}) {
  const startPasskeyCreate = useGraphQLMutation(startPasskeyCreateMutation);
  const finishPasskeyCreate = useGraphQLMutation(finishPasskeyCreateMutation);

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Passkeys</Heading>

        {passkeys.length > 0 && (
          <BlockStack spacing>
            {passkeys.map((passkey) => (
              <Passkey key={passkey.id} passkey={passkey} onUpdate={onUpdate} />
            ))}
          </BlockStack>
        )}

        <Button
          onPress={async () => {
            const [{startRegistration}, result] = await Promise.all([
              import('@simplewebauthn/browser'),
              startPasskeyCreate.run(),
            ]);

            if (result.data == null) {
              // TODO: handle error
              return;
            }

            const registrationOptions = JSON.parse(
              result.data.startPasskeyCreate.result,
            );

            const registrationResult =
              await startRegistration(registrationOptions);

            await finishPasskeyCreate.run({
              credential: JSON.stringify(registrationResult),
            });

            await onUpdate();
          }}
        >
          Create a Passkey
        </Button>
      </BlockStack>
    </Section>
  );
}

interface PasskeyProps {
  passkey: AccountQueryData.Me.Passkeys;
  onUpdate(): Promise<void>;
}

function Passkey(props: PasskeyProps) {
  const {id} = props.passkey;

  return (
    <InlineGrid spacing sizes={['fill', 'auto']}>
      <Text>{id}</Text>
      <Button overlay={<PasskeyManageMenu {...props} />}>Manage</Button>
    </InlineGrid>
  );
}

function PasskeyManageMenu({passkey: {id}, onUpdate}: PasskeyProps) {
  const deletePasskey = useGraphQLMutation(deletePasskeyMutation);

  return (
    <Popover>
      <Menu>
        <Button
          icon="delete"
          role="destructive"
          onPress={async () => {
            await deletePasskey.run({id});
            await onUpdate();
          }}
        >
          Delete
        </Button>
      </Menu>
    </Popover>
  );
}

function AppleSection({
  account,
  onUpdate,
}: {
  account?: AccountQueryData.Me.AppleAccount | null;
  onUpdate(): Promise<void>;
}) {
  const currentUrl = useCurrentURL();
  const connectAppleAccount = useGraphQLMutation(connectAppleAccountMutation);
  const disconnectAppleAccount = useGraphQLMutation(
    disconnectAppleAccountMutation,
  );

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Apple account</Heading>
        {account?.email ? <Text>email: {account.email}</Text> : null}
        {account ? (
          <Button
            onPress={async () => {
              await disconnectAppleAccount.run();
              await onUpdate();
            }}
          >
            Disconnect
          </Button>
        ) : (
          <SignInWithAppleButton
            redirectUrl={
              new URL('/internal/auth/apple/connect/callback', currentUrl)
            }
            onPress={async ({idToken, authorizationCode}) => {
              await connectAppleAccount.run({
                idToken,
                authorizationCode,
              });

              await onUpdate();
            }}
          >
            Connect
          </SignInWithAppleButton>
        )}
      </BlockStack>
    </Section>
  );
}

function GoogleSection({
  account,
  onUpdate,
}: {
  account?: AccountQueryData.Me.GoogleAccount | null;
  onUpdate(): Promise<void>;
}) {
  const disconnectAccount = useGraphQLMutation(disconnectGoogleAccountMutation);

  if (account == null) {
    return <ConnectGoogleAccount onUpdate={onUpdate} />;
  }

  const {email} = account;

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Google account</Heading>
        <TextBlock>username: {email}</TextBlock>
        <Button
          onPress={async () => {
            await disconnectAccount.run();
            await onUpdate();
          }}
        >
          Disconnect
        </Button>
      </BlockStack>
    </Section>
  );
}

function ConnectGoogleAccount({onUpdate}: {onUpdate(): Promise<void>}) {
  const currentUrl = useCurrentURL();
  const [error, setError] = useState(false);

  const open = useGoogleOAuthModal(GoogleOAuthFlow.Connect, (event) => {
    setError(!event.success);
    if (event.success) onUpdate();
  });

  const errorContent = error ? (
    <Banner tone="critical">
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
        <Button
          onPress={() => {
            setError(false);
            open({redirectTo: currentUrl.href});
          }}
        >
          Connect Google
        </Button>
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
  const disconnectAccount = useGraphQLMutation(disconnectGithubAccountMutation);

  if (account == null) {
    return <ConnectGithubAccount onConnectionChange={onConnectionChange} />;
  }

  const {username, profileUrl} = account;

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Github account</Heading>
        <TextBlock>username: {username}</TextBlock>
        <Button to={profileUrl} target="new">
          Visit profile
        </Button>
        <Button
          onPress={async () => {
            await disconnectAccount.run();
            onConnectionChange();
          }}
        >
          <Text>
            Disconnect <Text emphasis="strong">{username}</Text>
          </Text>
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
  const currentUrl = useCurrentURL();
  const [error, setError] = useState(false);

  const open = useGithubOAuthModal(GithubOAuthFlow.Connect, (event) => {
    setError(!event.success);
    if (event.success) onConnectionChange?.();
  });

  const errorContent = error ? (
    <Banner tone="critical">
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

  const updateAccountSpoilerAvoidance = useGraphQLMutation(
    updateAccountSpoilerAvoidanceMutation,
  );

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Settings</Heading>
        <SpoilerAvoidance
          value={spoilerAvoidanceSignal}
          onChange={async (spoilerAvoidance) => {
            spoilerAvoidanceSignal.value = spoilerAvoidance;
            await updateAccountSpoilerAvoidance.run({spoilerAvoidance});
            await refetch();
          }}
        />
      </BlockStack>
    </Section>
  );
}
