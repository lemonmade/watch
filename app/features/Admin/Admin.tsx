import {
  Action,
  Banner,
  BlockStack,
  InlineStack,
  Tag,
  Text,
  PrettyDate,
  InlineGrid,
  Popover,
  Menu,
  Icon,
} from '@lemon/zest';
import {Redirect} from '@quilted/quilt/navigation';

import {
  useGraphQLQuery,
  useGraphQLMutation,
  useGraphQLQueryRefetchOnMount,
  useGraphQLQueryData,
} from '~/shared/graphql';
import {Page} from '~/shared/page.ts';
import {useUser} from '~/shared/user.ts';

import createAccountGiftCardMutation from './graphql/CreateAccountGiftCodeMutation.graphql';
import giftCodeListQuery, {
  type GiftCodeListQueryData,
} from './graphql/GiftCodeListQuery.graphql';

export default function Admin() {
  const user = useUser();

  if (user.role !== 'ADMIN') return <Redirect to="/app" />;

  return (
    <Page heading="Admin">
      <CreateGiftCodeSection />
    </Page>
  );
}

function CreateGiftCodeSection() {
  const query = useGraphQLQuery(giftCodeListQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {giftCodes} = useGraphQLQueryData(query);

  const createAccountGiftCard = useGraphQLMutation(
    createAccountGiftCardMutation,
  );

  return (
    <BlockStack spacing>
      {createAccountGiftCard.latest.value?.data?.createAccountGiftCode
        .giftCode && (
        <Banner>
          <UnusedGiftCode
            giftCode={
              createAccountGiftCard.latest.value.data?.createAccountGiftCode
                .giftCode
            }
          />
        </Banner>
      )}

      <Action
        onPress={async () => {
          await createAccountGiftCard.run();
          await query.rerun();
        }}
      >
        Create gift code
      </Action>

      <BlockStack spacing>
        {giftCodes.map((giftCode) =>
          giftCode.redeemedAt ? (
            <RedeemedGiftCode key={giftCode.id} giftCode={giftCode} />
          ) : (
            <UnusedGiftCode key={giftCode.id} giftCode={giftCode} />
          ),
        )}
      </BlockStack>
    </BlockStack>
  );
}

function UnusedGiftCode({
  giftCode,
}: {
  giftCode: Omit<GiftCodeListQueryData.GiftCodes, 'redeemedAt'>;
}) {
  return (
    <InlineGrid sizes={['fill', 'auto']} spacing="small">
      <BlockStack spacing="small.2">
        <Text emphasis>{giftCode.code}</Text>

        <Text emphasis="subdued">
          Created <PrettyDate date={giftCode.createdAt} />
        </Text>
      </BlockStack>

      <Action
        detail={<Icon source="more" />}
        overlay={
          <Popover>
            <Menu>
              <Action onPress={() => copy(giftCode.code)}>
                Copy gift code
              </Action>
              <Action onPress={() => copy(giftCode.createAccountUrl)}>
                Copy account create link
              </Action>
            </Menu>
          </Popover>
        }
      >
        Actions
      </Action>
    </InlineGrid>
  );
}

function RedeemedGiftCode({
  giftCode,
}: {
  giftCode: Omit<GiftCodeListQueryData.GiftCodes, 'redeemedAt'> & {
    redeemedAt: Required<GiftCodeListQueryData.GiftCodes['redeemedAt']>;
  };
}) {
  return (
    <BlockStack>
      <InlineStack spacing="small">
        <Text emphasis>{giftCode.code}</Text>
        <Tag>Redeemed</Tag>
      </InlineStack>

      <Text emphasis="subdued">
        Created <PrettyDate date={giftCode.createdAt} />
      </Text>
    </BlockStack>
  );
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // TODO: handle error
  }
}
