import {createRemoteReactComponent} from '@remote-ui/react';

interface Series {
  poster?: string;
}

interface Episode {
  title: string;
  poster?: string;
  number: number;
  seasonNumber: number;
  firstAired?: string;
}

interface Props {
  to: string;
  series: Series;
  nextEpisode?: Episode;
  unfinishedEpisodeCount?: number;
}

export const WatchThroughItem = createRemoteReactComponent<
  'WatchThroughItem',
  Props
>('WatchThroughItem');
