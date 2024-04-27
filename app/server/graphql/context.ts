import type {
  EnhancedRequest,
  EnhancedResponse,
} from '@quilted/quilt/request-router';

import {type UserRole} from '~/graphql/types.ts';

import {type Prisma} from '../shared/database';

export interface Context {
  readonly user: {id: string; role: UserRole};
  readonly prisma: Prisma;
  readonly request: EnhancedRequest;
  readonly response: MutableResponse;
}

interface MutableResponse {
  status: EnhancedResponse['status'];
  readonly headers: EnhancedResponse['headers'];
  readonly cookies: EnhancedResponse['cookies'];
}
