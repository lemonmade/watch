import {useState} from 'react';
import {useNavigate} from '@quilted/quilt';

import {
  Icon,
  BlockStack,
  InlineStack,
  Action,
  Checkbox,
  Heading,
  TextBlock,
  TextField,
  Rating,
  Image,
  Text,
  DateField,
  Form,
  Section,
  View,
} from '@lemon/zest';

import {Page} from '~/shared/page';
import {SpoilerAvoidance} from '~/shared/spoilers';
import {useQuery, useMutation} from '~/shared/graphql';

import watchThroughQuery from './graphql/WatchThroughQuery.graphql';
import type {WatchThroughQueryData} from './graphql/WatchThroughQuery.graphql';
import watchNextEpisodeMutation from './graphql/WatchThroughWatchNextEpisodeMutation.graphql';
import type {WatchThroughWatchNextEpisodeMutationVariables} from './graphql/WatchThroughWatchNextEpisodeMutation.graphql';
import skipNextEpisodeMutation from './graphql/WatchThroughSkipNextEpisodeMutation.graphql';
import type {WatchThroughSkipNextEpisodeMutationVariables} from './graphql/WatchThroughSkipNextEpisodeMutation.graphql';
import stopWatchThroughMutation from './graphql/StopWatchThroughMutation.graphql';
import deleteWatchThroughMutation from './graphql/DeleteWatchThroughMutation.graphql';
import updateWatchThroughSettingsMutation from './graphql/UpdateWatchThroughSettingsMutation.graphql';

export interface Props {
  id: string;
}

export default function WatchThrough({id}: Props) {
  const {data, refetch} = useQuery(watchThroughQuery, {
    variables: {id},
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
      heading={series.name}
      detail={
        nextEpisode
          ? from.season === to.season
            ? `Watching season ${to.season}`
            : `Watching seasons ${from.season}–${to.season}`
          : null
      }
      menu={
        <>
          <Action
            icon={<Icon source="arrowEnd" />}
            to={`/app/series/${series.handle}`}
          >
            More about {series.name}
          </Action>
          {status === 'ONGOING' && (
            <Action
              role="destructive"
              icon={<Icon source="stop" />}
              onPress={() => {
                stopWatchThrough.mutate(
                  {id},
                  {
                    onSuccess({stopWatchThrough}) {
                      if (stopWatchThrough.watchThrough?.id) {
                        navigate('/app');
                      }
                    },
                  },
                );
              }}
            >
              Stop watching
            </Action>
          )}
          <Action
            role="destructive"
            icon={<Icon source="delete" />}
            onPress={() => {
              deleteWatchThrough.mutate(
                {id},
                {
                  onSuccess({deleteWatchThrough}) {
                    if (deleteWatchThrough) {
                      navigate('/app');
                    }
                  },
                },
              );
            }}
          >
            Delete
          </Action>
        </>
      }
    >
      <BlockStack spacing>
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
            onAction={() => refetch()}
          />
        )}
        {actions.length > 0 && <PreviousActionsSection actions={actions} />}
        <Section>
          <BlockStack spacing>
            <Heading>Settings</Heading>
            <SpoilerAvoidance
              value={settings.spoilerAvoidance}
              onChange={(spoilerAvoidance) => {
                updateWatchThroughSettings.mutate(
                  {id, spoilerAvoidance},
                  {
                    onSuccess: () => refetch(),
                  },
                );
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
      <BlockStack spacing>
        <Heading>Previous actions</Heading>
        {actions.map((action) => {
          if (action.__typename === 'Skip') {
            return (
              <BlockStack spacing key={action.id}>
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
                {action.notes ? (
                  <Text>
                    Notes
                    {action.notes.containsSpoilers
                      ? ' (contains spoilers)'
                      : ''}
                    : {action.notes.content}
                  </Text>
                ) : null}
              </BlockStack>
            );
          } else if (action.__typename === 'Watch') {
            return (
              <BlockStack spacing>
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
                {action.notes ? (
                  <Text>
                    Notes
                    {action.notes.containsSpoilers
                      ? ' (contains spoilers)'
                      : ''}
                    : {action.notes.content}
                  </Text>
                ) : null}
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
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const watchNextEpisode = useMutation(watchNextEpisodeMutation);
  const skipNextEpisode = useMutation(skipNextEpisodeMutation);
  const [at, setAt] = useState<Date | null>(() => new Date());

  const markEpisodeAsWatched = () => {
    const optionalArguments: Omit<
      WatchThroughWatchNextEpisodeMutationVariables,
      'episode' | 'watchThrough'
    > = {
      finishedAt: at?.toISOString(),
    };

    if (notes) optionalArguments.notes = {content: notes, containsSpoilers};
    if (rating) optionalArguments.rating = rating;

    watchNextEpisode.mutate(
      {
        ...optionalArguments,
        episode: id,
        watchThrough: watchThroughId,
      },
      {
        onSettled: onAction,
      },
    );
  };

  return (
    <Form onSubmit={markEpisodeAsWatched}>
      <BlockStack spacing>
        {image && <Image source={image} aspectRatio={1.77} fit="cover" />}
        <BlockStack spacing>
          <BlockStack spacing="small">
            <Heading>{title}</Heading>
            <Text emphasis="subdued">
              Season {seasonNumber}, episode {episodeNumber}
              {firstAired && (
                <>
                  {' • '}
                  {firstAired.toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                    day: 'numeric',
                  })}
                </>
              )}
            </Text>
          </BlockStack>

          {overview && <TextBlock>{overview}</TextBlock>}

          <View>
            <Rating
              value={rating ?? undefined}
              onChange={(rating) =>
                rating === 0 ? setRating(null) : setRating(rating)
              }
            />
          </View>
          <TextField
            label="Notes"
            multiline={4}
            blockSize="fitContent"
            value={notes ?? ''}
            onChange={setNotes}
          />
          <Checkbox checked={containsSpoilers} onChange={setContainsSpoilers}>
            These notes contain spoilers
          </Checkbox>
          {at && <DateField label="Watched on" value={at} onChange={setAt} />}
        </BlockStack>
        <InlineStack spacing="small">
          <Action emphasis onPress={markEpisodeAsWatched}>
            Watch
          </Action>
          <Action
            onPress={() => {
              const optionalArguments: Omit<
                WatchThroughSkipNextEpisodeMutationVariables,
                'episode' | 'watchThrough'
              > = {at: at?.toISOString()};

              if (notes) {
                optionalArguments.notes = {content: notes, containsSpoilers};
              }

              skipNextEpisode.mutate(
                {
                  ...optionalArguments,
                  episode: id,
                  watchThrough: watchThroughId,
                },
                {
                  onSettled: onAction,
                },
              );
            }}
          >
            Skip
          </Action>
        </InlineStack>
      </BlockStack>
    </Form>
  );
}
