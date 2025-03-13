import type {
  EnhancedRequest,
  EnhancedResponse,
} from '@quilted/quilt/request-router';

import {type UserRole} from '~/graphql/types.ts';
import {type PrismaClient} from '~/global/database.ts';

import {type E2ETestContext, type Environment} from '../context.ts';

export interface Context {
  readonly user: {id: string; role: UserRole};
  readonly prisma: PrismaClient;
  readonly request: EnhancedRequest;
  readonly response: MutableResponse;
  readonly env: Environment;
  readonly e2e?: E2ETestContext;
}

interface MutableResponse {
  status: EnhancedResponse['status'];
  readonly headers: EnhancedResponse['headers'];
  readonly cookies: EnhancedResponse['cookies'];
}
