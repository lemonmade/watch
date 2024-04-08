import type {Queue} from '@cloudflare/workers-types';
import {createEdgeDatabaseConnection} from '~/global/database.ts';

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

let prismaPromise: Promise<import('@prisma/client').PrismaClient> | undefined;

export async function createPrisma(url: string) {
  prismaPromise ??= createEdgeDatabaseConnection({url});
  return await prismaPromise;
}
