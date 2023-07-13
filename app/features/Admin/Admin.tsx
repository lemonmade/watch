import {Action, Banner, BlockStack, InlineStack, Text} from '@lemon/zest';

import {useMutation} from '~/shared/graphql';
import {Page} from '~/shared/page';

import createAccountGiftCardMutation from './graphql/CreateAccountGiftCodeMutation.graphql';

export default function Admin() {
  return (
    <Page heading="Admin">
      <CreateGiftCodeSection />
    </Page>
  );
}

function CreateGiftCodeSection() {
  const createAccountGiftCard = useMutation(createAccountGiftCardMutation);

  return (
    <BlockStack spacing>
      {createAccountGiftCard.isSuccess && (
        <Banner>
          <BlockStack spacing="small">
            <InlineStack spacing="small">
              <Text>
                Code:{' '}
                <Text emphasis>
                  {createAccountGiftCard.data.createAccountGiftCode.code}
                </Text>
              </Text>
              <Action size="small">Copy</Action>
            </InlineStack>

            <Text>
              URL:{' '}
              <Text emphasis>
                {createAccountGiftCard.data.createAccountGiftCode.code}
              </Text>
            </Text>
          </BlockStack>
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
