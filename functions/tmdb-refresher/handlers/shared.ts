import type {Queue} from '@cloudflare/workers-types';

export interface Environment {
  DATABASE_URL: string;
  TMDB_ACCESS_TOKEN: string;
  TMDB_REFRESHER_QUEUE: Queue<Message>;
}

export interface Message {
  id: string;
  name: string;
  tmdbId: string;
}
