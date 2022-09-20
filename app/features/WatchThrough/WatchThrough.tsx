import {type PropsWithChildren} from 'react';
import {useNavigate} from '@quilted/quilt';
import {useSignal, type Signal} from '@watching/react-signals';

import {
  raw,
  BlockStack,
  InlineStack,
  Action,
  Checkbox,
  Heading,
  Layout,
  TextField,
  Rating,
  Image,
  Text,
  DatePicker,
  Form,
  Menu,
  Section,
  Popover,
  Modal,
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
          <Action icon="arrowEnd" to={`/app/series/${series.handle}`}>
            More about {series.name}
          </Action>
          {status === 'ONGOING' && (
            <Action
              role="destructive"
              icon="stop"
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
            icon="delete"
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
  const rating = useSignal<null | number>(null);
  const notes = useSignal<null | string>(null);
  const containsSpoilers = useSignal(false);
  const at = useSignal<Date>(new Date());
  const submitting = useSignal(false);

  return (
    <WatchEpisodeForm
      id={id}
      watchThroughId={watchThroughId}
      loading={submitting}
      at={at}
      rating={rating}
      notes={notes}
      containsSpoilers={containsSpoilers}
      onWatchStart={() => {
        submitting.value = true;
      }}
      onWatch={() => {
        submitting.value = false;
        onAction?.();
      }}
    >
      <BlockStack spacing>
        {image && <Image source={image} aspectRatio={1.77} fit="cover" />}
        <BlockStack spacing>
          <Layout spacing blockAlignment="start" columns={['fill', 'auto']}>
            <BlockStack spacing="small">
              <Heading>{title}</Heading>

              <BlockStack spacing="tiny">
                <Text emphasis="subdued">
                  Season {seasonNumber}, Episode {episodeNumber}
                </Text>
                {firstAired && (
                  <Text emphasis="subdued">
                    {firstAired.toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                      day: 'numeric',
                    })}
                  </Text>
                )}
              </BlockStack>
            </BlockStack>

            <Action
              emphasis
              type="submit"
              accessory={
                <Action
                  icon="more"
                  accessibilityLabel="More actions"
                  popover={
                    <Popover inlineAttachment="end">
                      <Menu>
                        <SkipEpisodeAction
                          id={id}
                          loading={submitting}
                          watchThroughId={watchThroughId}
                          at={at}
                          notes={notes}
                          containsSpoilers={containsSpoilers}
                          onSkipStart={() => {
                            submitting.value = true;
                          }}
                          onSkip={() => {
                            submitting.value = false;
                            onAction?.();
                          }}
                        />
                        <SkipEpisodeWithNotesAction
                          id={id}
                          episodeNumber={episodeNumber}
                          seasonNumber={seasonNumber}
                          title={title}
                          image={image}
                          loading={submitting}
                          watchThroughId={watchThroughId}
                          onSkip={onAction}
                        />
                      </Menu>
                    </Popover>
                  }
                />
              }
            >
              Watch
            </Action>
          </Layout>

          <InlineStack spacing>
            <EpisodeRating value={rating} />
            <WatchedAt value={at} />
          </InlineStack>

          <DetailedReview notes={notes} containsSpoilers={containsSpoilers} />
        </BlockStack>
      </BlockStack>
    </WatchEpisodeForm>
  );
}

interface WatchEpisodeFormProps {
  id: string;
  loading: Signal<boolean>;
  at: Signal<Date>;
  rating: Signal<number | null>;
  notes: Signal<string | null>;
  containsSpoilers: Signal<boolean>;
  watchThroughId: string;
  onWatch?(): void;
  onWatchStart?(): void;
}

function WatchEpisodeForm({
  id,
  at,
  notes,
  rating,
  loading,
  containsSpoilers,
  watchThroughId,
  onWatch,
  onWatchStart,
  children,
}: PropsWithChildren<WatchEpisodeFormProps>) {
  const {mutate, isLoading} = useMutation(watchNextEpisodeMutation);

  const watchEpisode = () => {
    const optionalArguments: Omit<
      WatchThroughWatchNextEpisodeMutationVariables,
      'episode' | 'watchThrough'
    > = {
      finishedAt: at.value?.toISOString(),
    };

    if (notes.value) {
      optionalArguments.notes = {
        content: notes.value,
        containsSpoilers: containsSpoilers.value,
      };
    }

    if (rating.value) {
      optionalArguments.rating = rating.value;
    }

    onWatchStart?.();
    mutate(
      {
        ...optionalArguments,
        episode: id,
        watchThrough: watchThroughId,
      },
      {
        onSettled: onWatch,
      },
    );
  };

  return (
    <Form loading={isLoading || loading.value || false} onSubmit={watchEpisode}>
      {children}
    </Form>
  );
}

function EpisodeRating({value: rating}: {value: Signal<null | number>}) {
  return (
    <Rating
      value={rating.value ?? undefined}
      onChange={(newRating) => {
        rating.value = newRating === 0 ? null : newRating;
      }}
    />
  );
}

function WatchedAt({value: at}: {value: Signal<Date>}) {
  return (
    <DatePicker
      label="Watched on"
      value={at.value}
      onChange={(newDate) => {
        at.value = newDate;
      }}
    />
  );
}

function DetailedReview({
  notes,
  containsSpoilers,
}: {
  notes: Signal<null | string>;
  containsSpoilers: Signal<boolean>;
}) {
  return (
    <>
      <NotesTextField value={notes} />
      <NotesContainSpoilersCheckbox value={containsSpoilers} />
    </>
  );
}

function NotesTextField({value: notes}: {value: Signal<null | string>}) {
  return (
    <TextField
      label="Notes"
      multiline={4}
      blockSize="fitContent"
      value={notes.value ?? ''}
      onChange={(newNote) => {
        notes.value = newNote;
      }}
    />
  );
}

function NotesContainSpoilersCheckbox({
  value: containsSpoilers,
}: {
  value: Signal<boolean>;
}) {
  return (
    <Checkbox
      checked={containsSpoilers.value}
      onChange={(newContainsSpoilers) => {
        containsSpoilers.value = newContainsSpoilers;
      }}
    >
      These notes contain spoilers
    </Checkbox>
  );
}

interface SkipEpisodeActionProps extends SkipEpisodeOptions {
  loading: Signal<boolean>;
}

function SkipEpisodeAction({loading, ...options}: SkipEpisodeActionProps) {
  const skipEpisode = useSkipEpisode(options);

  return (
    <Action loading={loading.value} icon="arrowEnd" onPress={skipEpisode}>
      Skip
    </Action>
  );
}

interface SkipEpisodeWithNotesActionProps
  extends Omit<
    SkipEpisodeOptions,
    'at' | 'notes' | 'containsSpoilers' | 'onSkipStart'
  > {
  title: string;
  image?: string;
  seasonNumber: number;
  episodeNumber: number;
  loading: Signal<boolean>;
}

function SkipEpisodeWithNotesAction(props: SkipEpisodeWithNotesActionProps) {
  return (
    <Action
      loading={props.loading.value}
      icon="arrowEnd"
      modal={<SkipEpisodeModal {...props} />}
    >
      Skip with note…
    </Action>
  );
}

function SkipEpisodeModal({
  title,
  image,
  episodeNumber,
  seasonNumber,
  loading,
  ...options
}: SkipEpisodeWithNotesActionProps) {
  const notes = useSignal<null | string>(null);
  const containsSpoilers = useSignal(false);
  const at = useSignal<Date>(new Date());

  const skipEpisode = useSkipEpisode({...options, at, notes, containsSpoilers});

  return (
    <Modal>
      <Form onSubmit={skipEpisode}>
        <BlockStack padding="large" spacing>
          <Heading>Skip episode</Heading>

          <Layout
            border="subdued"
            cornerRadius
            columns={image ? [raw`8rem`, 'fill'] : undefined}
          >
            {image ? (
              <Image source={image} aspectRatio={1.77} fit="cover" />
            ) : null}
            <BlockStack spacing="small" padding>
              <Text>{title}</Text>
              <Text emphasis="subdued">
                Season {seasonNumber}, Episode {episodeNumber}
              </Text>
            </BlockStack>
          </Layout>

          <DetailedReview notes={notes} containsSpoilers={containsSpoilers} />

          <InlineStack alignment="spaceBetween">
            <WatchedAt value={at} />
            <Action emphasis type="submit">
              Skip Episode
            </Action>
          </InlineStack>
        </BlockStack>
      </Form>
    </Modal>
  );
}

interface SkipEpisodeOptions {
  id: string;
  watchThroughId: string;
  at?: Signal<Date>;
  notes?: Signal<string | null>;
  containsSpoilers?: Signal<boolean>;
  onSkip?(): void;
  onSkipStart?(): void;
}

function useSkipEpisode({
  id,
  watchThroughId,
  at,
  notes,
  containsSpoilers,
  onSkip,
  onSkipStart,
}: SkipEpisodeOptions) {
  const {mutate} = useMutation(skipNextEpisodeMutation);

  const skipEpisode = () => {
    const optionalArguments: Omit<
      WatchThroughSkipNextEpisodeMutationVariables,
      'episode' | 'watchThrough'
    > = {at: at?.value?.toISOString()};

    if (notes?.value) {
      optionalArguments.notes = {
        content: notes.value,
        containsSpoilers: containsSpoilers?.value ?? false,
      };
    }

    onSkipStart?.();
    mutate(
      {
        ...optionalArguments,
        episode: id,
        watchThrough: watchThroughId,
      },
      {
        onSettled: onSkip,
      },
    );
  };

  return skipEpisode;
}
