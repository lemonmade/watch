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
  Pressable,
  Link,
} from '@lemon/zest';

import {Page} from 'components';
import {parseGid} from 'utilities/graphql';

import watchThroughQuery from './graphql/WatchThroughQuery.graphql';
import watchNextEpisodeMutation from './graphql/WatchThroughWatchNextEpisodeMutation.graphql';
import skipNextEpisodeMutation from './graphql/WatchThroughSkipNextEpisodeMutation.graphql';
import stopWatchThroughMutation from './graphql/StopWatchThroughMutation.graphql';
import deleteWatchThroughMutation from './graphql/DeleteWatchThroughMutation.graphql';

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

  if (data?.watchThrough == null) return null;

  const {nextEpisode, status, series} = data.watchThrough;

  return (
    <Page
      heading={
        <BlockStack spacing="small">
          {nextEpisode && (
            <Text>Watching season {nextEpisode.season.number}</Text>
          )}
          <Heading>{series.name}</Heading>
        </BlockStack>
      }
      actions={
        <Menu>
          <Link to={`/series/${parseGid(series.id).id}`}>
            More about {series.name}
          </Link>
          {status === 'ONGOING' && (
            <Pressable
              onPress={async () => {
                const {data} = await stopWatchThrough({
                  variables: {id},
                });

                if (data?.stopWatchThrough.watchThrough?.id) {
                  navigate('/');
                }
              }}
            >
              Stop watching
            </Pressable>
          )}
          <Pressable
            onPress={async () => {
              const {data} = await deleteWatchThrough({
                variables: {id},
              });

              if (data?.deleteWatchThrough) {
                navigate('/');
              }
            }}
          >
            Delete
          </Pressable>
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
      </BlockStack>
    </Page>
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

  return (
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
        <Button
          primary
          onPress={async () => {
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
          }}
        >
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
  );
}
