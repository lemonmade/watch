import type {Context as HonoContextType} from 'hono';

import {
  createEdgeDatabaseConnection,
  type PrismaClient,
} from '~/global/database.ts';

export interface Environment {
  readonly DATABASE_URL: string;
  readonly JWT_DEFAULT_SECRET: string;
  readonly JWT_E2E_TEST_HEADER_SECRET: string;
  readonly GITHUB_CLIENT_ID: string;
  readonly GITHUB_CLIENT_SECRET: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly APP_SECRET_ENCRYPTION_KEY: string;
  readonly UPLOAD_CLIPS_JWT_SECRET: string;
  readonly STRIPE_API_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
}

export type HonoEnv = {Bindings: Environment};
export type HonoContext = HonoContextType<HonoEnv>;

export interface HonoContextVariableMap {
  readonly prisma: PrismaContext;
}

declare module 'hono' {
  interface ContextVariableMap extends HonoContextVariableMap {}
}

export interface E2ETestContext {
  readonly git: {readonly sha: string};
}

export class PrismaContext {
  #instance?: PrismaClient;
  #promise?: Promise<PrismaClient>;
  readonly #url: string;

  constructor(url: string) {
    this.#url = url;
  }

  get instance() {
    return this.#instance;
  }

  async load() {
    if (this.#instance) {
      return this.#instance;
    }

    this.#promise ??= (async () => {
      const db = await createEdgeDatabaseConnection({url: this.#url});
      this.#instance = db;
      return db;
    })();

    const instance = await this.#promise;

    return instance;
  }
}
