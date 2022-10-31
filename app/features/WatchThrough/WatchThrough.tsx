import {useMemo, type PropsWithChildren} from 'react';
import {
  signal,
  useSignal,
  type Signal,
  useNavigate,
  createOptionalContext,
  createUseContextHook,
} from '@quilted/quilt';

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
  PrettyDate,
} from '@lemon/zest';

import {Page} from '~/shared/page';
import {SpoilerAvoidance} from '~/shared/spoilers';
import {useQuery, useMutation, type PickTypename} from '~/shared/graphql';

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

export interface Props {
  id: string;
}

type WatchThrough = WatchThroughQueryData.WatchThrough;
type WatchAction = PickTypename<WatchThrough['actions'][number], 'Watch'>;
type SkipAction = PickTypename<WatchThrough['actions'][number], 'Skip'>;

interface PageDetails {
  initialActionDate: Signal<Date | undefined>;
}

const PageDetailsContext = createOptionalContext<PageDetails>();
const usePageDetails = createUseContextHook(PageDetailsContext);

export default function WatchThroughDetails({id}: Props) {
  const {data, refetch} = useQuery(watchThroughQuery, {
    variables: {id},
  });

  if (data?.watchThrough == null) return null;

  return (
    <WatchThroughWithData watchThrough={data.watchThrough} onUpdate={refetch} />
  );
}

function WatchThroughWithData({
  watchThrough,
  onUpdate,
}: {
  watchThrough: WatchThroughQueryData.WatchThrough;
  onUpdate(): Promise<any>;
}) {
  const {id, nextEpisode, status, series, actions, settings, from, to} =
    watchThrough;

  const watchingSingleSeason = from.season === to.season;

  const pageDetails = useMemo<PageDetails>(() => {
    const initialActionDate = signal(new Date());
    return {initialActionDate};
  }, []);

  const nextEpisodeDetailContent = nextEpisode
    ? watchingSingleSeason
      ? `Watching Season ${to.season}`
      : `Watching Seasons ${from.season}–${to.season}`
    : null;

  const statusDetailContent =
    status === 'FINISHED' ? (
      <Tag>Finished</Tag>
    ) : status === 'STOPPED' ? (
      <Tag>Stopped</Tag>
    ) : null;

  return (
    <PageDetailsContext.Provider value={pageDetails}>
      <Page
        heading={series.name}
        detail={
          nextEpisodeDetailContent && statusDetailContent ? (
            <InlineStack spacing="small">
              {statusDetailContent}
              {nextEpisodeDetailContent}
            </InlineStack>
          ) : (
            nextEpisodeDetailContent ?? statusDetailContent
          )
        }
        menu={
          <Menu>
            <Action icon="arrowEnd" to={`/app/series/${series.handle}`}>
              More about {series.name}
            </Action>
            {status === 'ONGOING' && <StopWatchThroughAction id={id} />}
            <DeleteWatchThroughAction id={id} name={series.name} />
          </Menu>
        }
      >
        <BlockStack spacing="huge">
          {nextEpisode != null && nextEpisode.hasAired ? (
            <NextEpisode
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
              onUpdate={() => onUpdate()}
            />
          ) : nextEpisode != null || status === 'ONGOING' ? (
            <UpToDate nextEpisode={nextEpisode} />
          ) : null}

          {actions.length > 0 && <PreviousEpisodesSection actions={actions} />}

          <SettingsSection id={id} settings={settings} onUpdate={onUpdate} />
        </BlockStack>
      </Page>
    </PageDetailsContext.Provider>
  );
}

function UpToDate({nextEpisode}: {nextEpisode?: WatchThrough['nextEpisode']}) {
  return (
    <Section padding="large" border="subdued" cornerRadius>
      <BlockStack spacing align="center">
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

function NextEpisode({
  id,
  title,
  image,
  firstAired,
  watchThroughId,
  episodeNumber,
  seasonNumber,
  watchingSingleSeason,
  onUpdate,
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
  onUpdate(): void | Promise<void>;
}) {
  const {initialActionDate} = usePageDetails();

  const rating = useSignal<number | undefined>(undefined, [id]);
  const notes = useSignal<string | undefined>(undefined, [id]);
  const containsSpoilers = useSignal(false, [id]);
  const at = useSignal<Date | undefined>(initialActionDate.value, [id]);

  return (
    <WatchEpisodeForm
      id={id}
      watchThroughId={watchThroughId}
      at={at}
      rating={rating}
      notes={notes}
      containsSpoilers={containsSpoilers}
      onUpdate={onUpdate}
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
                    <PrettyDate date={firstAired} />
                  </Text>
                )}
              </BlockStack>
            </BlockStack>

            <Action
              emphasis
              icon="watch"
              perform="submit"
              accessory={
                <Action
                  icon="more"
                  accessibilityLabel="More actions"
                  popover={
                    <Popover inlineAttachment="end">
                      <Menu>
                        <SkipEpisodeAction
                          id={id}
                          at={at}
                          notes={notes}
                          containsSpoilers={containsSpoilers}
                          watchThroughId={watchThroughId}
                          onUpdate={onUpdate}
                        />
                        <SkipEpisodeWithNotesAction
                          id={id}
                          episodeNumber={episodeNumber}
                          seasonNumber={seasonNumber}
                          title={title}
                          image={image}
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
  at: Signal<Date | undefined>;
  rating: Signal<number | undefined>;
  notes: Signal<string | undefined>;
  containsSpoilers: Signal<boolean>;
  watchThroughId: string;
  onUpdate(): void | Promise<void>;
}

function WatchEpisodeForm({
  id,
  at,
  notes,
  rating,
  containsSpoilers,
  watchThroughId,
  children,
  onUpdate,
}: PropsWithChildren<WatchEpisodeFormProps>) {
  const {mutateAsync} = useMutation(watchNextEpisodeMutation);

  const watchEpisode = async () => {
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

    await mutateAsync({
      ...optionalArguments,
      episode: id,
      watchThrough: watchThroughId,
    });

    await onUpdate();
  };

  return <Form onSubmit={watchEpisode}>{children}</Form>;
}

function EpisodeRating({value: rating}: {value: Signal<number | undefined>}) {
  return (
    <Rating
      size="large"
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
      <Checkbox disabled={!hasNotes} checked={hasNotes && containsSpoilers}>
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

interface SkipEpisodeActionProps extends SkipEpisodeOptions {}

function SkipEpisodeAction(options: SkipEpisodeActionProps) {
  const skipEpisode = useSkipEpisode(options);

  return (
    <Action icon="skip" onPress={skipEpisode}>
      Skip
    </Action>
  );
}

interface SkipEpisodeWithNotesActionProps
  extends Omit<SkipEpisodeOptions, 'at' | 'notes' | 'containsSpoilers'> {
  title: string;
  image?: string;
  seasonNumber: number;
  episodeNumber: number;
}

function SkipEpisodeWithNotesAction(props: SkipEpisodeWithNotesActionProps) {
  return (
    <Action icon="skip" modal={<SkipEpisodeModal {...props} />}>
      Skip with note…
    </Action>
  );
}

function SkipEpisodeModal({
  title,
  image,
  episodeNumber,
  seasonNumber,
  ...options
}: SkipEpisodeWithNotesActionProps) {
  const {initialActionDate} = usePageDetails();

  const at = useSignal<Date | undefined>(initialActionDate.value);
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
            <Action emphasis perform="submit">
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
  onUpdate(): void | Promise<void>;
}

function useSkipEpisode({
  id,
  watchThroughId,
  at,
  notes,
  containsSpoilers,
  onUpdate,
}: SkipEpisodeOptions) {
  const {mutateAsync} = useMutation(skipNextEpisodeMutation);

  const skipEpisode = async () => {
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

    await mutateAsync({
      ...optionalArguments,
      episode: id,
      watchThrough: watchThroughId,
    });

    await onUpdate();
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
          <Action perform="closeContainingOverlay">Cancel</Action>

          <Action
            role="destructive"
            onPress={async () => {
              await deleteWatchThrough.mutateAsync(
                {id},
                {
                  onSuccess({deleteWatchThrough}) {
                    if (deleteWatchThrough) {
                      navigate('/app', {replace: true});
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
      onPress={async () => {
        await stopWatchThrough.mutateAsync(
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
    rating != null ? <Rating value={rating} readonly /> : null;

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
      <BlockStack spacing="tiny">
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
      <BlockStack spacing="small">
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

function SettingsSection({
  id,
  settings,
  onUpdate,
}: {
  id: string;
  settings: WatchThroughQueryData.WatchThrough.Settings;
  onUpdate(): void | Promise<void>;
}) {
  const updateWatchThroughSettings = useMutation(
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
          onChange={(newSpoilerAvoidance) => {
            spoilerAvoidance.value = newSpoilerAvoidance;
            updateWatchThroughSettings.mutate(
              {id, spoilerAvoidance: newSpoilerAvoidance},
              {
                onSuccess() {
                  onUpdate();
                },
              },
            );
          }}
        />
      </BlockStack>
    </Section>
  );
}
