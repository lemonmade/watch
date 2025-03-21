import {useMemo} from 'preact/hooks';
import type {ComponentChild, RenderableProps} from 'preact';

import {signal, useSignal, type Signal} from '@quilted/quilt/signals';
import {useNavigate} from '@quilted/quilt/navigation';
import {useLocalizedFormatting} from '@quilted/quilt/localize';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {createOptionalContext} from '@quilted/quilt/context';

import {
  Style,
  BlockStack,
  InlineStack,
  Button,
  ActionList,
  Checkbox,
  Heading,
  InlineGrid,
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
  PrettyDate,
  EpisodeImage,
  Divider,
} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {SpoilerAvoidance} from '~/shared/spoilers.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
  useGraphQLMutation,
  type PickTypename,
} from '~/shared/graphql.ts';
import {Clip, useClips} from '~/shared/clips.ts';
import {MediaSelectorText} from '~/shared/media.ts';

import watchThroughQuery, {
  type WatchThroughQueryData,
} from './graphql/WatchThroughQuery.graphql';
import watchNextEpisodeMutation from './graphql/WatchThroughWatchNextEpisodeMutation.graphql';
import type {WatchThroughWatchNextEpisodeMutationVariables} from './graphql/WatchThroughWatchNextEpisodeMutation.graphql';
import skipNextEpisodeMutation from './graphql/WatchThroughSkipNextEpisodeMutation.graphql';
import type {WatchThroughSkipNextEpisodeMutationVariables} from './graphql/WatchThroughSkipNextEpisodeMutation.graphql';
import stopWatchThroughMutation from './graphql/StopWatchThroughMutation.graphql';
import deleteWatchThroughMutation from './graphql/DeleteWatchThroughMutation.graphql';
import updateWatchThroughSettingsMutation from './graphql/UpdateWatchThroughSettingsMutation.graphql';
import startWatchThroughFromWatchThroughMutation, {
  type StartWatchThroughFromWatchThroughMutationVariables,
} from './graphql/StartWatchThroughFromWatchThroughMutation.graphql';
import toggleSubscriptionToWatchThroughSeriesMutation from './graphql/ToggleSubscriptionToWatchThroughSeriesMutation.graphql';
import {EpisodeSelection} from '@watching/api';

export interface Props {
  id: string;
}

type WatchThrough = WatchThroughQueryData.WatchThrough;
type WatchAction = PickTypename<WatchThrough['actions'][number], 'Watch'>;
type SkipAction = PickTypename<WatchThrough['actions'][number], 'Skip'>;

interface PageDetails {
  initialActionDate: Signal<Date | undefined>;
}

type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

export interface WatchForm {
  readonly media: NonNullable<WatchThrough['nextEpisode']>;
  readonly at: Signal<Date | undefined>;
  readonly rating: Signal<number | undefined>;
  readonly notes: {
    readonly content: Signal<string | undefined>;
    readonly containsSpoilers: Signal<boolean>;
  };
}

const PageDetailsContext = createOptionalContext<PageDetails>();
const usePageDetails = PageDetailsContext.use;

export default function WatchThroughDetails({id}: Props) {
  const query = useGraphQLQuery(watchThroughQuery, {variables: {id}});
  useGraphQLQueryRefetchOnMount(query);

  const {watchThrough} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  if (watchThrough == null) return null;

  return (
    <WatchThroughWithData
      watchThrough={watchThrough}
      onUpdate={() => query.rerun()}
    />
  );
}

function WatchThroughWithData({
  watchThrough,
  onUpdate,
}: {
  watchThrough: WatchThroughQueryData.WatchThrough;
  onUpdate(): Promise<any>;
}) {
  const {
    id,
    url,
    nextEpisode,
    status,
    series,
    actions,
    settings,
    from,
    to,
    clipsToRender,
  } = watchThrough;

  const watchingSingleSeason = from.season === to.season;

  const pageDetails = useMemo<PageDetails>(() => {
    const initialActionDate = signal(new Date());
    return {initialActionDate};
  }, []);

  const nextEpisodeForm = useMemo(
    () =>
      signal<WatchForm | undefined>(
        watchFormFromNextEpisode(nextEpisode, pageDetails.initialActionDate),
      ),
    [],
  );

  if (nextEpisodeForm.peek()?.media.id !== nextEpisode?.id) {
    nextEpisodeForm.value = watchFormFromNextEpisode(
      nextEpisode,
      pageDetails.initialActionDate,
    );
  }

  const episodeRangeContentPrefix = status === 'ONGOING' ? 'Watching ' : '';

  const episodeRangeContent = watchingSingleSeason
    ? `${episodeRangeContentPrefix}Season ${to.season}`
    : `${episodeRangeContentPrefix}Seasons ${from.season}–${to.season}`;

  const statusDetailContent =
    status === 'FINISHED' ? (
      <Tag>Finished</Tag>
    ) : status === 'STOPPED' ? (
      <Tag>Stopped</Tag>
    ) : null;

  let content: ComponentChild = null;

  switch (status) {
    case 'FINISHED': {
      content = (
        <Finished watchThrough={watchThrough} onUpdate={() => onUpdate()} />
      );
      break;
    }
    case 'STOPPED': {
      content = <Stopped />;
      break;
    }
    case 'ONGOING': {
      content = nextEpisode?.hasAired ? (
        <NextEpisode
          form={nextEpisodeForm}
          watchThroughId={id}
          onUpdate={() => onUpdate()}
        />
      ) : (
        <UpToDate nextEpisode={nextEpisode} />
      );

      break;
    }
  }

  return (
    <PageDetailsContext.Provider value={pageDetails}>
      <Page
        heading={series.name}
        detail={
          episodeRangeContent && statusDetailContent ? (
            <InlineStack spacing="small">
              {episodeRangeContent}
              {statusDetailContent}
            </InlineStack>
          ) : (
            (episodeRangeContent ?? statusDetailContent)
          )
        }
        menu={
          <Menu>
            <Button icon="arrow.end" to={series.url}>
              More about {series.name}
            </Button>
            {series.tmdbUrl && (
              <Button icon="arrow.end" target="new" to={series.tmdbUrl}>
                TMDB
              </Button>
            )}
            {series.imdbUrl && (
              <Button icon="arrow.end" target="new" to={series.imdbUrl}>
                IMDB
              </Button>
            )}
            {status === 'ONGOING' && <StopWatchThroughButton id={id} />}
            <DeleteWatchThroughButton id={id} name={series.name} />
          </Menu>
        }
      >
        <BlockStack spacing="large.2">
          {content}

          <AccessoryClips
            id={id}
            url={url}
            series={series}
            clips={clipsToRender}
            currentWatch={nextEpisodeForm}
          />

          {actions.length > 0 && <PreviousEpisodesSection actions={actions} />}

          {status === 'ONGOING' && (
            <SettingsSection id={id} settings={settings} onUpdate={onUpdate} />
          )}
        </BlockStack>
      </Page>
    </PageDetailsContext.Provider>
  );
}

function watchFormFromNextEpisode(
  nextEpisode: WatchThrough['nextEpisode'],
  initialActionDate: Signal<Date | undefined>,
): WatchForm | undefined {
  return nextEpisode && nextEpisode.hasAired
    ? {
        media: nextEpisode,
        at: signal(initialActionDate.peek()),
        rating: signal(undefined),
        notes: {
          content: signal(undefined),
          containsSpoilers: signal(false),
        },
      }
    : undefined;
}

function UpToDate({nextEpisode}: {nextEpisode?: WatchThrough['nextEpisode']}) {
  return (
    <Section padding="large" border="subdued" cornerRadius>
      <BlockStack spacing blockAlignment="center">
        <Heading level={4}>You’re all caught up!</Heading>

        {nextEpisode?.firstAired == null ? (
          <TextBlock>The next episode will appear here once it airs.</TextBlock>
        ) : (
          <TextBlock>
            The next episode airs{' '}
            <Text emphasis>
              <PrettyDate date={nextEpisode.firstAired} />
            </Text>
            .
          </TextBlock>
        )}
      </BlockStack>
    </Section>
  );
}

function Stopped() {
  return (
    <Section padding="large" border="subdued" cornerRadius>
      <BlockStack spacing blockAlignment="center">
        <Heading level={4}>You’ve finished this watch through!</Heading>
      </BlockStack>
    </Section>
  );
}

function Finished({
  watchThrough,
  onUpdate,
}: {
  watchThrough: WatchThrough;
  onUpdate(): Promise<void>;
}) {
  const {
    from,
    to,
    series,
    lastAction,
    nextSeason,
    startedAt,
    episodeSelection,
  } = watchThrough;
  const {formatDate} = useLocalizedFormatting();

  const lastActionWatch =
    lastAction?.__typename === 'Watch' ? lastAction : null;

  const finishedAt = watchThrough.finishedAt ?? lastActionWatch?.finishedAt;

  return (
    <Section>
      <BlockStack spacing="small">
        <BlockStack
          spacing="small"
          background="subdued"
          border="subdued"
          padding="small"
          cornerRadius
        >
          <Text emphasis="subdued">Watched {episodeSelection.join(', ')}</Text>
          <Text emphasis="subdued">
            Started{' '}
            {formatDate(new Date(startedAt), {
              dateStyle: 'long',
            })}
          </Text>
          <Text emphasis="subdued">
            {finishedAt
              ? `Finished ${formatDate(new Date(finishedAt), {
                  dateStyle: 'long',
                })}`
              : null}
          </Text>
        </BlockStack>
        {nextSeason && !nextSeason.isUpcoming && (
          <WatchAgainButton
            watchThrough={watchThrough}
            episodes={[nextSeason.selector]}
          >
            Watch Next Season
          </WatchAgainButton>
        )}
        {nextSeason &&
          !nextSeason.isUpcoming &&
          nextSeason.number !== series.seasonCount && (
            <WatchAgainButton
              watchThrough={watchThrough}
              episodes={[
                EpisodeSelection.stringify({
                  from: {season: nextSeason.number},
                  to: {season: series.seasonCount},
                }),
              ]}
            >
              Watch Rest of Series
            </WatchAgainButton>
          )}
        <WatchAgainButton watchThrough={watchThrough}>
          Watch Again
        </WatchAgainButton>
        {from.season !== to.season && (
          <WatchAgainButton
            watchThrough={watchThrough}
            episodes={[`S${to.season}`]}
          >
            Watch Season {to.season} Again
          </WatchAgainButton>
        )}
        {(series.status === 'RETURNING' ||
          series.status === 'IN_PRODUCTION' ||
          series.status === 'PLANNED') && (
          <SeriesSubscription watchThrough={watchThrough} onUpdate={onUpdate} />
        )}
      </BlockStack>
    </Section>
  );
}

function WatchAgainButton({
  children,
  watchThrough,
  episodes,
}: RenderableProps<{
  watchThrough: WatchThrough;
  episodes?: StartWatchThroughFromWatchThroughMutationVariables['episodes'];
}>) {
  const navigate = useNavigate();
  const startWatchThroughFromWatchThrough = useGraphQLMutation(
    startWatchThroughFromWatchThroughMutation,
  );

  return (
    <Button
      onPress={async () => {
        const result = await startWatchThroughFromWatchThrough.run({
          series: watchThrough.series.id,
          // @ts-expect-error Fixing this in Quilt
          episodes: episodes ?? watchThrough.episodeSelection,
        });

        const startedWatchThrough =
          result?.data?.startWatchThrough?.watchThrough;

        if (startedWatchThrough) {
          navigate(startedWatchThrough.url);
        }
      }}
    >
      {children}
    </Button>
  );
}

function SeriesSubscription({
  watchThrough,
  onUpdate,
}: {
  watchThrough: WatchThrough;
  onUpdate(): void | Promise<void>;
}) {
  const subscribed = watchThrough.series.subscription != null;
  const toggleSubscription = useGraphQLMutation(
    toggleSubscriptionToWatchThroughSeriesMutation,
  );

  return (
    <Checkbox
      checked={subscribed}
      onChange={async () => {
        await toggleSubscription.run({
          id: watchThrough.series.id,
        });

        await onUpdate();
      }}
      helpText="Automatically start watching new seasons as they air"
    >
      Subscribe to Series
    </Checkbox>
  );
}

function NextEpisode({
  form: {value: form},
  watchThroughId,
  onUpdate,
}: {
  form: Signal<WatchForm | undefined>;
  watchThroughId: string;
  onUpdate(): void | Promise<void>;
}) {
  if (form == null) return null;

  const {id, title, selector, firstAired, still} = form.media;

  const image = still?.source;

  return (
    <WatchEpisodeForm
      id={id}
      form={form}
      watchThroughId={watchThroughId}
      onUpdate={onUpdate}
    >
      <BlockStack spacing>
        {image && <EpisodeImage source={image} />}
        <BlockStack spacing>
          <Heading>{title}</Heading>

          <InlineStack
            spacing="small"
            background="emphasized"
            cornerRadius
            padding="small"
            border="subdued"
            blockAlignment="stretch"
          >
            <MediaSelectorText emphasis="subdued">{selector}</MediaSelectorText>
            {firstAired && (
              <>
                <Divider emphasis="subdued" />
                <Text emphasis="subdued">
                  Aired <PrettyDate date={firstAired} />
                </Text>
              </>
            )}
          </InlineStack>

          <InlineStack spacing>
            <Button
              emphasis
              size="large"
              icon="watch"
              perform="submit"
              accessory={
                <Button
                  icon="more"
                  accessibilityLabel="More actions"
                  overlay={
                    <Popover inlineAttachment="end">
                      <Menu>
                        <SkipEpisodeButton
                          form={form}
                          watchThroughId={watchThroughId}
                          onUpdate={onUpdate}
                        />
                        <SkipEpisodeWithNotesButton
                          form={form}
                          watchThroughId={watchThroughId}
                          onUpdate={onUpdate}
                        />
                      </Menu>
                    </Popover>
                  }
                />
              }
            >
              Watch
            </Button>
          </InlineStack>

          <InlineStack spacing>
            <EpisodeRating value={form.rating} />
            <EpisodeDatePicker action="watch" value={form.at} />
          </InlineStack>

          <DetailedReview notes={form.notes} />
        </BlockStack>
      </BlockStack>
    </WatchEpisodeForm>
  );
}

interface WatchEpisodeFormProps {
  id: string;
  form: WatchForm;
  watchThroughId: string;
  onUpdate(): void | Promise<void>;
}

function WatchEpisodeForm({
  id,
  form,
  watchThroughId,
  children,
  onUpdate,
}: RenderableProps<WatchEpisodeFormProps>) {
  const watchNextEpisode = useGraphQLMutation(watchNextEpisodeMutation);

  const {at, notes, rating} = form;

  const watchEpisode = async () => {
    const optionalArguments: Writable<
      Omit<
        WatchThroughWatchNextEpisodeMutationVariables,
        'episode' | 'watchThrough'
      >
    > = {
      finishedAt: at.value?.toISOString(),
    };

    if (notes.content.value) {
      optionalArguments.notes = {
        content: notes.content.value,
        containsSpoilers: notes.containsSpoilers.value,
      };
    }

    if (rating.value) {
      optionalArguments.rating = rating.value;
    }

    await watchNextEpisode.run({
      ...optionalArguments,
      episode: id,
      watchThrough: watchThroughId,
    });

    await onUpdate();
  };

  return <Form onSubmit={watchEpisode}>{children}</Form>;
}

function EpisodeRating({value: rating}: {value: WatchForm['rating']}) {
  return (
    <Rating
      size="large"
      value={rating.value}
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
  value: WatchForm['at'];
}) {
  const {initialActionDate} = usePageDetails();

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
      value={at}
      onChange={(newDate) => {
        at.value = newDate;
        initialActionDate.value = newDate;
      }}
    />
  );
}
function DetailedReview({notes}: {notes: WatchForm['notes']}) {
  const hasNotes = Boolean(notes.content.value);

  return (
    <>
      <NotesTextField value={notes.content} />
      <Checkbox
        disabled={!hasNotes}
        checked={hasNotes && notes.containsSpoilers}
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
      minimumLines={4}
      maximumLines={10}
      value={notes}
      onInput={(value) => {
        notes.value = value;
      }}
    />
  );
}

interface SkipEpisodeButtonProps extends SkipEpisodeOptions {}

function SkipEpisodeButton(options: SkipEpisodeButtonProps) {
  const skipEpisode = useSkipEpisode(options);

  return (
    <Button icon="skip" onPress={skipEpisode}>
      Skip
    </Button>
  );
}

interface SkipEpisodeWithNotesButtonProps extends SkipEpisodeOptions {}

function SkipEpisodeWithNotesButton(props: SkipEpisodeWithNotesButtonProps) {
  return (
    <Button icon="skip" overlay={<SkipEpisodeModal {...props} />}>
      Skip with note…
    </Button>
  );
}

function SkipEpisodeModal({
  form: watchForm,
  ...options
}: SkipEpisodeWithNotesButtonProps) {
  const {initialActionDate} = usePageDetails();

  const form = useMemo(
    () => watchFormFromNextEpisode(watchForm.media, initialActionDate)!,
    [watchForm.media, initialActionDate],
  );

  const skipEpisode = useSkipEpisode({...options, form});

  const {title, number, season, still} = form.media;
  const image = still?.source;

  return (
    <Modal padding>
      <Form onSubmit={skipEpisode}>
        <BlockStack spacing>
          <Heading>Skip episode</Heading>

          <InlineGrid
            sizes={image ? [Style.css`8rem`, 'fill'] : ['fill']}
            border="subdued"
            cornerRadius
          >
            {image ? (
              <Image source={image} aspectRatio={1.77} fit="cover" />
            ) : null}
            <BlockStack spacing="small" padding>
              <Text>{title}</Text>
              <Text emphasis="subdued">
                Season {season.number}, Episode {number}
              </Text>
            </BlockStack>
          </InlineGrid>

          <DetailedReview notes={form.notes} />

          <InlineStack alignment="space-between" spacing="small">
            <EpisodeDatePicker action="skip" value={form.at} />
            <Button emphasis perform="submit">
              Skip Episode
            </Button>
          </InlineStack>
        </BlockStack>
      </Form>
    </Modal>
  );
}

interface SkipEpisodeOptions {
  form: WatchForm;
  watchThroughId: string;
  onUpdate(): void | Promise<void>;
}

function useSkipEpisode({form, watchThroughId, onUpdate}: SkipEpisodeOptions) {
  const skipNextEpisode = useGraphQLMutation(skipNextEpisodeMutation);

  const {at, notes} = form;

  const skipEpisode = async () => {
    const optionalArguments: Writable<
      Omit<
        WatchThroughSkipNextEpisodeMutationVariables,
        'episode' | 'watchThrough'
      >
    > = {at: at?.value?.toISOString()};

    if (notes.content.value) {
      optionalArguments.notes = {
        content: notes.content.value,
        containsSpoilers: notes.containsSpoilers.value,
      };
    }

    await skipNextEpisode.run({
      ...optionalArguments,
      episode: form.media.id,
      watchThrough: watchThroughId,
    });

    await onUpdate();
  };

  return skipEpisode;
}

interface DeleteWatchThroughButtonProps {
  id: string;
  name: string;
}

function DeleteWatchThroughButton(props: DeleteWatchThroughButtonProps) {
  return (
    <Button
      role="destructive"
      icon="delete"
      overlay={<DeleteWatchThroughModal {...props} />}
    >
      Delete…
    </Button>
  );
}

function DeleteWatchThroughModal({id, name}: DeleteWatchThroughButtonProps) {
  const navigate = useNavigate();
  const deleteWatchThrough = useGraphQLMutation(deleteWatchThroughMutation);

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
          <Button perform="closeContainingOverlay">Cancel</Button>

          <Button
            role="destructive"
            onPress={async () => {
              const result = await deleteWatchThrough.run({id});

              if (result.data?.deleteWatchThrough?.deletedWatchThroughId) {
                navigate('/app', {replace: true});
              }
            }}
          >
            Delete
          </Button>
        </InlineStack>
      </BlockStack>
    </Modal>
  );
}

interface StopWatchThroughButtonProps {
  id: string;
}

function StopWatchThroughButton({id}: StopWatchThroughButtonProps) {
  const navigate = useNavigate();
  const stopWatchThrough = useGraphQLMutation(stopWatchThroughMutation);

  return (
    <Button
      icon="stop"
      onPress={async () => {
        const result = await stopWatchThrough.run({id});

        if (result.data?.stopWatchThrough?.watchThrough?.id) {
          navigate('/app');
        }
      }}
    >
      Stop watching
    </Button>
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
              <PreviousActionSkip key={action.id} action={action} />
            ) : action.__typename === 'Watch' ? (
              <PreviousActionWatch key={action.id} action={action} />
            ) : null,
          )}
        </ActionList>
      </BlockStack>
    </Section>
  );
}

function PreviousActionWatch({action}: {action: WatchAction}) {
  const {media, rating, notes} = action;

  const ratingContent =
    rating != null ? <Rating value={rating} readonly /> : null;

  const notesContent = notes ? <Tag>Notes</Tag> : null;

  const mediaContent =
    media.__typename === 'Episode' ? (
      <>
        <Text emphasis>{media.title}</Text>
        <Text emphasis="subdued">
          Season {media.seasonNumber}, Episode {media.number}
          {action.finishedAt ? ' • ' : ''}
          {action.finishedAt && <PrettyDate date={action.finishedAt} />}
        </Text>
      </>
    ) : media.__typename === 'Season' ? (
      <Text emphasis>Season {media.number}</Text>
    ) : null;

  return (
    <Button
      icon={
        <IconHighlight>
          <Icon source="watch" />
        </IconHighlight>
      }
      iconAlignment="start"
      detail={<Icon source="disclosure.inline.end" />}
      overlay={<PreviousActionWatchEditModal action={action} />}
    >
      <BlockStack spacing="small.2">
        {mediaContent}
        {ratingContent || notesContent ? (
          <InlineStack spacing="small" inlineAlignment="start">
            {ratingContent}
            {notesContent}
          </InlineStack>
        ) : null}
      </BlockStack>
    </Button>
  );
}

function PreviousActionWatchEditModal({action}: {action: WatchAction}) {
  return <Modal padding>{JSON.stringify(action.media)}</Modal>;
}

function PreviousActionSkip({action}: {action: SkipAction}) {
  const {media, at, notes} = action;

  const mediaContent =
    media.__typename === 'Episode' ? (
      <>
        <Text emphasis>{media.title}</Text>
        <Text emphasis="subdued">
          Season {media.seasonNumber}, Episode {media.number}
          {at ? ' • ' : ''}
          {at && <PrettyDate date={at} />}
        </Text>
      </>
    ) : media.__typename === 'Season' ? (
      <Text emphasis>Season {media.number}</Text>
    ) : null;

  return (
    <Button
      icon={
        <IconHighlight>
          <Icon source="skip" />
        </IconHighlight>
      }
      iconAlignment="start"
      detail={<Icon source="disclosure.inline.end" />}
      overlay={<PreviousActionSkipEditModal action={action} />}
    >
      <BlockStack spacing="small">
        {mediaContent}
        {notes ? (
          <InlineStack>
            <Tag>Notes</Tag>
          </InlineStack>
        ) : null}
      </BlockStack>
    </Button>
  );
}

function PreviousActionSkipEditModal({action}: {action: SkipAction}) {
  return <Modal padding>{JSON.stringify(action.media)}</Modal>;
}

function SettingsSection({
  id,
  settings,
  onUpdate,
}: {
  id: string;
  settings: WatchThroughQueryData.WatchThrough.Settings;
  onUpdate(): void | Promise<void>;
}) {
  const updateWatchThroughSettings = useGraphQLMutation(
    updateWatchThroughSettingsMutation,
  );

  const spoilerAvoidance = useSignal(settings.spoilerAvoidance, [
    settings.spoilerAvoidance,
  ]);

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Settings</Heading>
        <SpoilerAvoidance
          value={spoilerAvoidance}
          onChange={async (newSpoilerAvoidance) => {
            spoilerAvoidance.value = newSpoilerAvoidance;

            await updateWatchThroughSettings.run({
              id,
              spoilerAvoidance: newSpoilerAvoidance,
            });
            await onUpdate();
          }}
        />
      </BlockStack>
    </Section>
  );
}

function AccessoryClips({
  id,
  url,
  series,
  clips,
  currentWatch,
}: Pick<WatchThroughQueryData.WatchThrough, 'id' | 'url' | 'series'> & {
  clips: WatchThroughQueryData.WatchThrough['clipsToRender'];
  currentWatch: Signal<WatchForm | undefined>;
}) {
  const accessoryClips = useClips('watch-through.details.accessory', clips, {
    id,
    url,
    seriesId: series.id,
    seriesName: series.name,
    currentWatch,
  });

  if (accessoryClips.length === 0) return null;

  return (
    <BlockStack spacing="large">
      {accessoryClips.map((clip) => (
        <Clip key={clip.id} extensionPoint={clip} />
      ))}
    </BlockStack>
  );
}
