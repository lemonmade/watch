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

  const {subscribedOn, series, settings} = subscription;
  const {watchThroughs} = series;

  return (
    <Page
      heading={series.name}
      actions={
        <Menu>
          <Pressable
            onPress={async () => {
              await unsubscribeFromSeries({
                variables: {id},
              });

              navigate('/app/subscriptions', {replace: true});
            }}
          >
            Unsubscribe
          </Pressable>
        </Menu>
      }
    >
      <BlockStack>
        <TextBlock>
          Subscribed on {new Date(subscribedOn).toLocaleDateString()}
        </TextBlock>
        <Link to={`/app/series/${parseGid(series.id).id}`}>View series</Link>
        {watchThroughs.length > 0 && (
          <Section>
            <Heading>Watchthroughs</Heading>
            <BlockStack>
              {watchThroughs.map((watchThrough) => (
                <BlockStack key={watchThrough.id}>
                  <TextBlock>
                    From <EpisodeSliceText {...watchThrough.from} />, to{' '}
                    <EpisodeSliceText {...watchThrough.to} />
                    {watchThrough.status === 'ONGOING'
                      ? ' (still watching)'
                      : ''}
                  </TextBlock>
                  <Link
                    to={`/app/watchthrough/${parseGid(watchThrough.id).id}`}
                  >
                    See watch through
                  </Link>
                </BlockStack>
              ))}
            </BlockStack>
          </Section>
        )}

        <Section>
          <Heading>Settings</Heading>
          <SpoilerAvoidance
            value={settings.spoilerAvoidance}
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

function EpisodeSliceText({
  season,
  episode,
}: {
  season: number;
  episode?: number | null;
}) {
  return (
    <>
      season {season}
      {episode == null ? '' : `, episode ${episode}`}
    </>
  );
}
