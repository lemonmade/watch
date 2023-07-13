import type {
  EnhancedRequest,
  EnhancedResponse,
} from '@quilted/quilt/request-router';

import {type UserRole} from '~/graphql/types.ts';

import {type Prisma} from '../shared/database';
import {type Authentication} from '../shared/auth';

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

export function createContext(
  auth: Authentication,
  prisma: Prisma,
  request: EnhancedRequest,
  response: MutableResponse,
): Context {
  return {
    prisma,
    get user() {
      if (auth.user == null) {
        response.status = 401;
        throw new Error('No user exists for this request!');
      }

      return auth.user;
    },
    request,
    response,
  };
}
