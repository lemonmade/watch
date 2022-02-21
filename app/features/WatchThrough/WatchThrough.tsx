import {useState} from 'react';
import {useQuery, useMutation, useNavigate} from '@quilted/quilt';

import {
  BlockStack,
  InlineStack,
  Button,
  Heading,
  TextBlock,
  TextField,
  Rating,
  Image,
  Text,
  DateField,
  Menu,
  Link,
  Form,
  Section,
} from '@lemon/zest';

import {Page, SpoilerAvoidance} from 'components';
import {parseGid} from 'utilities/graphql';

import watchThroughQuery from './graphql/WatchThroughQuery.graphql';
import type {WatchThroughQueryData} from './graphql/WatchThroughQuery.graphql';
import watchNextEpisodeMutation from './graphql/WatchThroughWatchNextEpisodeMutation.graphql';
import skipNextEpisodeMutation from './graphql/WatchThroughSkipNextEpisodeMutation.graphql';
import stopWatchThroughMutation from './graphql/StopWatchThroughMutation.graphql';
import deleteWatchThroughMutation from './graphql/DeleteWatchThroughMutation.graphql';
import updateWatchThroughSettingsMutation from './graphql/UpdateWatchThroughSettingsMutation.graphql';

export interface Props {
  id: string;
}

export default function WatchThrough({id}: Props) {
  const [key, setKey] = useState(1);
  const {data} = useQuery(watchThroughQuery, {
    variables: {id, key} as any,
  });
  const navigate = useNavigate();
  const stopWatchThrough = useMutation(stopWatchThroughMutation);
  const deleteWatchThrough = useMutation(deleteWatchThroughMutation);
  const updateWatchThroughSettings = useMutation(
    updateWatchThroughSettingsMutation,
  );

  if (data?.watchThrough == null) return null;

  const {nextEpisode, status, series, actions, settings, from, to} =
    data.watchThrough;

  return (
    <Page
      heading={
        <BlockStack spacing="small">
          {nextEpisode && (
            <Text>
              {from.season === to.season
                ? `Watching season ${to.season}`
                : `Watching seasons ${from.season}–${to.season}`}
            </Text>
          )}
          <Heading>{series.name}</Heading>
        </BlockStack>
      }
      actions={
        <Menu>
          <Link to={`/app/series/${parseGid(series.id).id}`}>
            More about {series.name}
          </Link>
          {status === 'ONGOING' && (
            <Button
              onPress={async () => {
                const {data} = await stopWatchThrough({
                  variables: {id},
                });

                if (data?.stopWatchThrough.watchThrough?.id) {
                  navigate('/app');
                }
              }}
            >
              Stop watching
            </Button>
          )}
          <Button
            onPress={async () => {
              const {data} = await deleteWatchThrough({
                variables: {id},
              });

              if (data?.deleteWatchThrough) {
                navigate('/app');
              }
            }}
          >
            Delete
          </Button>
        </Menu>
      }
    >
      <BlockStack>
        {nextEpisode && (
          <NextEpisode
            key={nextEpisode.id}
            id={nextEpisode.id}
            title={nextEpisode.title}
            episodeNumber={nextEpisode.number}
            seasonNumber={nextEpisode.season.number}
            firstAired={
              nextEpisode.firstAired
                ? new Date(nextEpisode.firstAired)
                : undefined
            }
            watchThroughId={id}
            image={nextEpisode.still?.source ?? undefined}
            overview={nextEpisode.overview ?? undefined}
            onAction={() => setKey((key) => key + 1)}
          />
        )}
        {actions.length > 0 && <PreviousActionsSection actions={actions} />}
        <Section>
          <BlockStack>
            <Heading>Settings</Heading>
            <SpoilerAvoidance
              value={settings.spoilerAvoidance}
              onChange={async (spoilerAvoidance) => {
                await updateWatchThroughSettings({
                  variables: {id, spoilerAvoidance},
                });

                setKey((key) => key + 1);
              }}
            />
          </BlockStack>
        </Section>
      </BlockStack>
    </Page>
  );
}

function PreviousActionsSection({
  actions,
}: {
  actions: readonly WatchThroughQueryData.WatchThrough.Actions[];
}) {
  return (
    <Section>
      <BlockStack>
        <Heading>Previous actions</Heading>
        {actions.map((action) => {
          if (action.__typename === 'Skip') {
            return (
              <BlockStack key={action.id}>
                <Text>
                  Skipped{' '}
                  {action.media.__typename === 'Episode' ? 'episode' : 'season'}{' '}
                  {action.media.__typename === 'Episode' ||
                  action.media.__typename === 'Season'
                    ? action.media.number
                    : ''}
                  {action.at
                    ? ` (on ${new Date(action.at).toLocaleDateString()})`
                    : ''}
                </Text>
              </BlockStack>
            );
          } else if (action.__typename === 'Watch') {
            return (
              <BlockStack>
                <Text>
                  Watched{' '}
                  {action.media.__typename === 'Episode' ? 'episode' : 'season'}{' '}
                  {action.media.__typename === 'Episode' ||
                  action.media.__typename === 'Season'
                    ? action.media.number
                    : ''}
                  {action.finishedAt
                    ? ` (on ${new Date(
                        action.finishedAt,
                      ).toLocaleDateString()})`
                    : ''}
                </Text>
                <Text>Rating: {action.rating}</Text>
              </BlockStack>
            );
          } else {
            return null;
          }
        })}
      </BlockStack>
    </Section>
  );
}

function NextEpisode({
  id,
  title,
  image,
  overview,
  firstAired,
  watchThroughId,
  episodeNumber,
  seasonNumber,
  onAction,
}: {
  id: string;
  title: string;
  image?: string;
  overview?: string;
  firstAired?: Date;
  watchThroughId: string;
  episodeNumber: number;
  seasonNumber: number;
  onAction?(): void;
}) {
  const [rating, setRating] = useState<null | number>(null);
  const [notes, setNotes] = useState<null | string>(null);
  const watchNextEpisode = useMutation(watchNextEpisodeMutation);
  const skipNextEpisode = useMutation(skipNextEpisodeMutation);
  const [at, setAt] = useState<Date | null>(() => new Date());

  const markEpisodeAsWatched = async () => {
    const optionalArguments: {[key: string]: any} = {
      finishedAt: at,
    };

    if (notes) optionalArguments.notes = notes;
    if (rating) optionalArguments.rating = rating;

    try {
      await watchNextEpisode({
        variables: {
          ...optionalArguments,
          episode: id,
          watchThrough: watchThroughId,
        },
      });
    } finally {
      onAction?.();
    }
  };

  return (
    <Form onSubmit={markEpisodeAsWatched}>
      <BlockStack>
        {image && <Image source={image} aspectRatio={1.77} fit="cover" />}
        <BlockStack>
          <TextBlock>
            Season {seasonNumber}, episode {episodeNumber}
            {firstAired && (
              <span>
                {' • '}
                {firstAired.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                  day: 'numeric',
                })}
              </span>
            )}
          </TextBlock>
          <Heading>{title}</Heading>
          {overview && <TextBlock>{overview}</TextBlock>}
          <TextField multiline value={notes ?? ''} onChange={setNotes} />
        </BlockStack>
        <InlineStack>
          <Rating
            value={rating ?? undefined}
            onChange={(rating) =>
              rating === 0 ? setRating(null) : setRating(rating)
            }
          />
          {at && <DateField value={at} onChange={setAt} />}
        </InlineStack>
        <InlineStack>
          <Button primary onPress={markEpisodeAsWatched}>
            Watch
          </Button>
          <Button
            onPress={async () => {
              const optionalArguments: {[key: string]: any} = {at};

              if (notes) optionalArguments.notes = notes;

              try {
                await skipNextEpisode({
                  variables: {
                    ...optionalArguments,
                    episode: id,
                    watchThrough: watchThroughId,
                  },
                });
              } finally {
                onAction?.();
              }
            }}
          >
            Skip
          </Button>
        </InlineStack>
      </BlockStack>
    </Form>
  );
}
