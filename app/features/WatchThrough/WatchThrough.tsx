import React, {useState} from 'react';
import {useQuery, useMutation} from '@quilted/quilt';

import {
  BlockStack,
  InlineStack,
  Page,
  Button,
  Heading,
  TextBlock,
  TextField,
  Rating,
  Image,
  DateField,
} from 'components';

import watchThroughQuery from './graphql/WatchThroughQuery.graphql';
import watchNextEpisodeMutation from './graphql/WatchThroughWatchNextEpisodeMutation.graphql';
import skipNextEpisodeMutation from './graphql/WatchThroughSkipNextEpisodeMutation.graphql';

export interface Props {
  id: string;
}

export function WatchThrough({id}: Props) {
  const {data} = useQuery(watchThroughQuery, {
    variables: {id},
  });

  if (data?.watchThrough == null) return null;

  const {nextEpisode} = data.watchThrough;

  return (
    <Page title={data.watchThrough.series.name}>
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
        />
      )}
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
}: {
  id: string;
  title: string;
  image?: string;
  overview?: string;
  firstAired?: Date;
  watchThroughId: string;
  episodeNumber: number;
  seasonNumber: number;
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

            await watchNextEpisode({
              variables: {
                ...optionalArguments,
                episode: id,
                watchThrough: watchThroughId,
              },
            });
          }}
        >
          Watch
        </Button>
        <Button
          onPress={async () => {
            const optionalArguments: {[key: string]: any} = {at};

            if (notes) optionalArguments.notes = notes;

            await skipNextEpisode({
              variables: {
                ...optionalArguments,
                episode: id,
                watchThrough: watchThroughId,
              },
            });
          }}
        >
          Skip
        </Button>
      </InlineStack>
    </BlockStack>
  );
}
