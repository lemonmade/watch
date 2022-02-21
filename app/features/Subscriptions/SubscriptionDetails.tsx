import {useState} from 'react';

import {useMutation, useQuery, useNavigate} from '@quilted/quilt';
import {NotFound} from '@quilted/quilt/http';
import {
  Link,
  Section,
  Heading,
  TextBlock,
  BlockStack,
  Menu,
  Pressable,
} from '@lemon/zest';

import {Page, SpoilerAvoidance} from 'components';
import {parseGid} from 'utilities/graphql';

import subscriptionDetailsQuery from './graphql/SubscriptionDetailsQuery.graphql';
import unsubscribeFromSeriesMutation from './graphql/UnsubscribeFromSeriesMutation.graphql';
import updateSubscriptionSettingsMutation from './graphql/UpdateSubscriptionSettingsMutation.graphql';

interface Props {
  id: string;
}

export function SubscriptionDetails({id}: Props) {
  const [key, setKey] = useState(0);
  const {data} = useQuery(subscriptionDetailsQuery, {
    variables: {
      id,
      // @ts-expect-error temporary
      key,
    },
  });

  const navigate = useNavigate();
  const unsubscribeFromSeries = useMutation(unsubscribeFromSeriesMutation);
  const updateSubscriptionSettings = useMutation(
    updateSubscriptionSettingsMutation,
  );

  if (data == null) {
    return null;
  }

  const subscription = data?.subscription;

  if (subscription == null) {
    return <NotFound />;
  }

  return (
    <Page
      heading={subscription.series.name}
      actions={
        <Menu>
          <Pressable
            onPress={async () => {
              await unsubscribeFromSeries({
                variables: {id},
              });

              navigate('/app/subscriptions');
            }}
          >
            Unsubscribe
          </Pressable>
        </Menu>
      }
    >
      <BlockStack>
        <TextBlock>
          Subscribed on{' '}
          {new Date(subscription.subscribedOn).toLocaleDateString()}
        </TextBlock>
        {subscription.series.poster && (
          <Link to={`/app/series/${parseGid(subscription.series.id).id}`}>
            View series
          </Link>
        )}
        <Section>
          <Heading>Settings</Heading>
          <SpoilerAvoidance
            value={subscription.settings.spoilerAvoidance}
            onChange={async (spoilerAvoidance) => {
              await updateSubscriptionSettings({
                variables: {id, spoilerAvoidance},
              });

              setKey((key) => key + 1);
            }}
          />
        </Section>
      </BlockStack>
    </Page>
  );
}
