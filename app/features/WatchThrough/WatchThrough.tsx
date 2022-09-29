import {useMemo, type PropsWithChildren} from 'react';
import {useNavigate} from '@quilted/quilt';
import {useSignal, type Signal} from '@watching/react-signals';

import {
  raw,
  BlockStack,
  InlineStack,
  Action,
  ActionList,
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
  TextBlock,
  Tag,
  Icon,
  IconHighlight,
} from '@lemon/zest';

import {Page} from '~/shared/page';
import {SpoilerAvoidance} from '~/shared/spoilers';
import {useQuery, useMutation, type PickTypename} from '~/shared/graphql';

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

type WatchThrough = WatchThroughQueryData.WatchThrough;
type WatchAction = PickTypename<WatchThrough['actions'][number], 'Watch'>;
type SkipAction = PickTypename<WatchThrough['actions'][number], 'Skip'>;

export default function WatchThrough({id}: Props) {
  const {data, refetch} = useQuery(watchThroughQuery, {
    variables: {id},
  });
  const updateWatchThroughSettings = useMutation(
    updateWatchThroughSettingsMutation,
  );

  if (data?.watchThrough == null) return null;

  const {nextEpisode, status, series, actions, settings, from, to} =
    data.watchThrough;

  const watchingSingleSeason = from.season === to.season;

  return (
    <Page
      heading={series.name}
      detail={
        nextEpisode
          ? watchingSingleSeason
            ? `Watching Season ${to.season}`
            : `Watching Seasons ${from.season}–${to.season}`
          : null
      }
      menu={
        <>
          <Action icon="arrowEnd" to={`/app/series/${series.handle}`}>
            More about {series.name}
          </Action>
          {status === 'ONGOING' && <StopWatchThroughAction id={id} />}
          <DeleteWatchThroughAction id={id} name={series.name} />
        </>
      }
    >
      <BlockStack spacing="huge">
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
            watchingSingleSeason={watchingSingleSeason}
            onAction={() => refetch()}
          />
        )}
        {actions.length > 0 && <PreviousEpisodesSection actions={actions} />}
        <Section>
          <BlockStack spacing>
            <Heading divider>Settings</Heading>
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

function NextEpisode({
  id,
  title,
  image,
  firstAired,
  watchThroughId,
  episodeNumber,
  seasonNumber,
  watchingSingleSeason,
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
  watchingSingleSeason: boolean;
  onAction?(): void;
}) {
  const rating = useSignal<number | undefined>(undefined);
  const notes = useSignal<string | undefined>(undefined);
  const containsSpoilers = useSignal(false);
  const at = useSignal<Date | undefined>(new Date());
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
                {watchingSingleSeason ? (
                  <Text emphasis="subdued">Episode {episodeNumber}</Text>
                ) : (
                  <Text emphasis="subdued">
                    Season {seasonNumber}, Episode {episodeNumber}
                  </Text>
                )}
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
            <EpisodeDatePicker action="watch" value={at} />
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
  at: Signal<Date | undefined>;
  rating: Signal<number | undefined>;
  notes: Signal<string | undefined>;
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

function EpisodeRating({value: rating}: {value: Signal<number | undefined>}) {
  return (
    <Rating
      value={rating.value ?? undefined}
      onChange={(newRating) => {
        rating.value = newRating === 0 ? undefined : newRating;
      }}
    />
  );
}

function EpisodeDatePicker({
  action,
  value: at,
}: {
  action: 'watch' | 'skip';
  value: Signal<Date | undefined>;
}) {
  return (
    <DatePicker
      label={
        at.value
          ? action === 'watch'
            ? 'Watched'
            : 'Skipped'
          : action === 'watch'
          ? 'Watched on…'
          : 'Skipped on…'
      }
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
  notes: Signal<string | undefined>;
  containsSpoilers: Signal<boolean>;
}) {
  const hasNotes = Boolean(notes.value);

  return (
    <>
      <NotesTextField value={notes} />
      <Checkbox
        disabled={!hasNotes}
        checked={hasNotes && containsSpoilers}
        onChange={(checked) => {
          containsSpoilers.value = checked;
        }}
      >
        These notes contain spoilers
      </Checkbox>
    </>
  );
}

function NotesTextField({value: notes}: {value: Signal<string | undefined>}) {
  return (
    <TextField
      label="Notes"
      multiline={4}
      blockSize="fitContent"
      value={notes}
      changeTiming="input"
    />
  );
}

interface SkipEpisodeActionProps extends SkipEpisodeOptions {
  loading: Signal<boolean>;
}

function SkipEpisodeAction({loading, ...options}: SkipEpisodeActionProps) {
  const skipEpisode = useSkipEpisode(options);

  return (
    <Action loading={loading.value} icon="skip" onPress={skipEpisode}>
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
      icon="skip"
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
  const at = useSignal<Date | undefined>(new Date());
  const notes = useSignal<string | undefined>(undefined);
  const containsSpoilers = useSignal(false);

  const skipEpisode = useSkipEpisode({...options, at, notes, containsSpoilers});

  return (
    <Modal padding>
      <Form onSubmit={skipEpisode}>
        <BlockStack spacing>
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

          <InlineStack alignment="spaceBetween" spacing="small">
            <EpisodeDatePicker action="skip" value={at} />
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
  at?: Signal<Date | undefined>;
  notes?: Signal<string | undefined>;
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

interface DeleteWatchThroughActionProps {
  id: string;
  name: string;
}

function DeleteWatchThroughAction(props: DeleteWatchThroughActionProps) {
  return (
    <Action
      role="destructive"
      icon="delete"
      modal={<DeleteWatchThroughModal {...props} />}
    >
      Delete…
    </Action>
  );
}

function DeleteWatchThroughModal({id, name}: DeleteWatchThroughActionProps) {
  const navigate = useNavigate();
  const deleteWatchThrough = useMutation(deleteWatchThroughMutation);

  return (
    <Modal padding>
      <BlockStack spacing>
        <Heading>Delete watch through</Heading>

        <TextBlock>
          Are you sure you want to delete this watch through of{' '}
          <Text emphasis>{name}</Text>? This will delete all of the ratings and
          notes you have left as part of this watch through, and can’t be
          undone.
        </TextBlock>

        <InlineStack alignment="end" spacing="small">
          <Action>Cancel</Action>

          <Action
            role="destructive"
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
        </InlineStack>
      </BlockStack>
    </Modal>
  );
}

interface StopWatchThroughActionProps {
  id: string;
}

function StopWatchThroughAction({id}: StopWatchThroughActionProps) {
  const navigate = useNavigate();
  const stopWatchThrough = useMutation(stopWatchThroughMutation);

  return (
    <Action
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
  );
}

function PreviousEpisodesSection({
  actions,
}: {
  actions: readonly WatchThroughQueryData.WatchThrough.Actions[];
}) {
  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Previous episodes</Heading>

        <ActionList>
          {actions.map((action) =>
            action.__typename === 'Skip' ? (
              <PreviousActionSkip action={action} />
            ) : action.__typename === 'Watch' ? (
              <PreviousActionWatch action={action} />
            ) : null,
          )}
        </ActionList>
      </BlockStack>
    </Section>
  );
}

function PreviousActionWatch({action}: {action: WatchAction}) {
  const {media, rating, notes} = action;

  if (media.__typename !== 'Episode') return null;

  const ratingContent =
    rating != null ? <Rating value={rating} size="small" readonly /> : null;

  const notesContent = notes ? <Tag>Notes</Tag> : null;

  return (
    <Action
      icon={
        <IconHighlight>
          <Icon source="watch" />
        </IconHighlight>
      }
      iconAlignment="start"
      detail={<Icon source="disclosureInlineEnd" />}
      modal={<PreviousActionWatchEditModal action={action} />}
    >
      <BlockStack spacing="small">
        <Text emphasis>{media.title}</Text>
        <Text emphasis="subdued">
          Season {media.season.number}, Episode {media.number}
          {action.finishedAt ? ' • ' : ''}
          {action.finishedAt && <PrettyDate date={action.finishedAt} />}
        </Text>
        {ratingContent || notesContent ? (
          <InlineStack spacing="small">
            {ratingContent}
            {notesContent}
          </InlineStack>
        ) : null}
      </BlockStack>
    </Action>
  );
}

function PreviousActionWatchEditModal({action}: {action: WatchAction}) {
  return <Modal padding>{JSON.stringify(action.media)}</Modal>;
}

function PreviousActionSkip({action}: {action: SkipAction}) {
  const {media, at, notes} = action;

  if (media.__typename !== 'Episode') return null;

  return (
    <Action
      icon={
        <IconHighlight>
          <Icon source="skip" />
        </IconHighlight>
      }
      iconAlignment="start"
      detail={<Icon source="disclosureInlineEnd" />}
      modal={<PreviousActionSkipEditModal action={action} />}
    >
      <BlockStack spacing="small" key={action.id}>
        <Text emphasis>{media.title}</Text>
        <Text emphasis="subdued">
          Season {media.season.number}, Episode {media.number}
          {at ? ' • ' : ''}
          {at && <PrettyDate date={at} />}
        </Text>
        {notes ? <Tag>Notes</Tag> : null}
      </BlockStack>
    </Action>
  );
}

function PreviousActionSkipEditModal({action}: {action: SkipAction}) {
  return <Modal padding>{JSON.stringify(action.media)}</Modal>;
}

function PrettyDate({date}: {date: string | Date}) {
  const dateString = typeof date === 'string' ? date : date.toISOString();

  const content = useMemo(
    () => new Date(dateString).toLocaleDateString(),
    [dateString],
  );

  return <>{content}</>;
}
