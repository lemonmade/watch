export interface TmdbSeries {
  name: string;
  overview?: string;
  status: string;
  poster_path?: string;
  number_of_seasons: number;
  first_air_date?: string;
  next_episode_to_air?: TmdbEpisode;
  last_episode_to_air?: TmdbEpisode;
}

export interface TmdbEpisode {
  episode_number: number;
  name: string;
  air_date?: string;
  overview: string;
  still_path?: string;
}

export interface TmdbSeason {
  season_number: number;
  air_date: string;
  overview: string;
  poster_path?: string;
  episodes: TmdbEpisode[];
}
