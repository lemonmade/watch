import {useMemo, type PropsWithChildren} from 'react';
import {
  signal,
  useSignal,
  type Signal,
  useNavigate,
  createOptionalContext,
  createUseContextHook,
  usePerformanceNavigation,
} from '@quilted/quilt';

import {
  Style,
  BlockStack,
  InlineStack,
  Action,
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
} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {SpoilerAvoidance} from '~/shared/spoilers.ts';
import {useQuery, useMutation, type PickTypename} from '~/shared/graphql.ts';
import {Clip, useClips} from '~/shared/clips.ts';

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
const usePageDetails = createUseContextHook(PageDetailsContext);

export default function WatchThroughDetails({id}: Props) {
  const {data, refetch, isLoading} = useQuery(watchThroughQuery, {
    variables: {id},
  });

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

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
  const {
    id,
    nextEpisode,
    status,
    series,
    actions,
    settings,
    from,
    to,
    clipsInstallations,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (nextEpisodeForm.peek()?.media.id !== nextEpisode?.id) {
    nextEpisodeForm.value = watchFormFromNextEpisode(
      nextEpisode,
      pageDetails.initialActionDate,
    );
  }

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
            <Action icon="arrow.end" to={`/app/series/${series.handle}`}>
              More about {series.name}
            </Action>
            {status === 'ONGOING' && <StopWatchThroughAction id={id} />}
            <DeleteWatchThroughAction id={id} name={series.name} />
          </Menu>
        }
      >
        <BlockStack spacing="large.2">
          {nextEpisode != null && nextEpisode.hasAired ? (
            <NextEpisode
              form={nextEpisodeForm}
              watchThroughId={id}
              watchingSingleSeason={watchingSingleSeason}
              onUpdate={() => onUpdate()}
            />
          ) : nextEpisode != null || status === 'ONGOING' ? (
            <UpToDate nextEpisode={nextEpisode} />
          ) : null}

          <AccessoryClips
            id={id}
            series={series}
            installations={clipsInstallations}
            currentWatch={nextEpisodeForm}
          />

          {actions.length > 0 && <PreviousEpisodesSection actions={actions} />}

          <SettingsSection id={id} settings={settings} onUpdate={onUpdate} />
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

function NextEpisode({
  form: {value: form},
  watchThroughId,
  watchingSingleSeason,
  onUpdate,
}: {
  form: Signal<WatchForm | undefined>;
  watchThroughId: string;
  watchingSingleSeason: boolean;
  onUpdate(): void | Promise<void>;
}) {
  if (form == null) return null;

  const {id, title, number, season, firstAired, still} = form.media;

  const image = still?.source;

  return (
    <WatchEpisodeForm
      id={id}
      form={form}
      watchThroughId={watchThroughId}
      onUpdate={onUpdate}
    >
      <BlockStack spacing>
        {image && <Image source={image} aspectRatio={1.77} fit="cover" />}
        <BlockStack spacing>
          <InlineGrid sizes={['fill', 'auto']} spacing blockAlignment="start">
            <BlockStack spacing="small">
              <Heading>{title}</Heading>

              <BlockStack spacing="small.2">
                {watchingSingleSeason ? (
                  <Text emphasis="subdued">Episode {number}</Text>
                ) : (
                  <Text emphasis="subdued">
                    Season {season.number}, Episode {number}
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
                  overlay={
                    <Popover inlineAttachment="end">
                      <Menu>
                        <SkipEpisodeAction
                          form={form}
                          watchThroughId={watchThroughId}
                          onUpdate={onUpdate}
                        />
                        <SkipEpisodeWithNotesAction
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
            </Action>
          </InlineGrid>

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
}: PropsWithChildren<WatchEpisodeFormProps>) {
  const {mutateAsync} = useMutation(watchNextEpisodeMutation);

  const {at, notes, rating} = form;

  const watchEpisode = async () => {
    const optionalArguments: Omit<
      WatchThroughWatchNextEpisodeMutationVariables,
      'episode' | 'watchThrough'
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

    await mutateAsync({
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

interface SkipEpisodeWithNotesActionProps extends SkipEpisodeOptions {}

function SkipEpisodeWithNotesAction(props: SkipEpisodeWithNotesActionProps) {
  return (
    <Action icon="skip" overlay={<SkipEpisodeModal {...props} />}>
      Skip with note…
    </Action>
  );
}

function SkipEpisodeModal({
  form: watchForm,
  ...options
}: SkipEpisodeWithNotesActionProps) {
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

          <InlineStack alignment="spaceBetween" spacing="small">
            <EpisodeDatePicker action="skip" value={form.at} />
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
  form: WatchForm;
  watchThroughId: string;
  onUpdate(): void | Promise<void>;
}

function useSkipEpisode({form, watchThroughId, onUpdate}: SkipEpisodeOptions) {
  const {mutateAsync} = useMutation(skipNextEpisodeMutation);

  const {at, notes} = form;

  const skipEpisode = async () => {
    const optionalArguments: Omit<
      WatchThroughSkipNextEpisodeMutationVariables,
      'episode' | 'watchThrough'
    > = {at: at?.value?.toISOString()};

    if (notes.content.value) {
      optionalArguments.notes = {
        content: notes.content.value,
        containsSpoilers: notes.containsSpoilers.value,
      };
    }

    await mutateAsync({
      ...optionalArguments,
      episode: form.media.id,
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
      overlay={<DeleteWatchThroughModal {...props} />}
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
      detail={<Icon source="disclosure.inline.end" />}
      overlay={<PreviousActionWatchEditModal action={action} />}
    >
      <BlockStack spacing="small.2">
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
      detail={<Icon source="disclosure.inline.end" />}
      overlay={<PreviousActionSkipEditModal action={action} />}
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

function AccessoryClips({
  id,
  series,
  installations,
  currentWatch,
}: Pick<WatchThroughQueryData.WatchThrough, 'id' | 'series'> & {
  installations: WatchThroughQueryData.WatchThrough['clipsInstallations'];
  currentWatch: Signal<WatchForm | undefined>;
}) {
  const accessoryClips = useClips(
    'WatchThrough.Details.RenderAccessory',
    installations,
    {id, seriesId: series.id, seriesName: series.name, currentWatch},
  );

  if (accessoryClips.length === 0) return null;

  return (
    <BlockStack spacing="large">
      {accessoryClips.map((clip) => (
        <Clip key={clip.id} extension={clip} />
      ))}
    </BlockStack>
  );
}
