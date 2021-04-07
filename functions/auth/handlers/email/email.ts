import type {ExtendedRequest} from '@lemon/tiny-server';

import {
  // addAuthCookies,
  verifySignedToken,
} from 'shared/utilities/auth';
import {createDatabaseConnection, Table} from 'shared/utilities/database';

import {completeAuth, restartSignIn, restartCreateAccount} from '../shared';
import {
  CreateAccountErrorReason,
  SearchParam,
  SignInErrorReason,
} from '../../constants';

const db = createDatabaseConnection();

export async function signInFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);

  if (token == null) {
    return restartSignIn({request});
  }

  try {
    const {
      subject: email,
      data: {redirectTo},
      expired,
    } = verifySignedToken<{
      redirectTo?: string | null;
    }>(token);

    if (email == null) {
      restartSignIn({
        request,
        redirectTo: redirectTo ?? undefined,
      });
    }

    if (expired) {
      restartSignIn({
        request,
        reason: SignInErrorReason.Expired,
        redirectTo: redirectTo ?? undefined,
      });
    }

    // eslint-disable-next-line no-console
    console.log(
      `Signing in user with email: ${email}, redirect to: ${redirectTo}`,
    );

    const [user] = await db
      .select(['id'])
      .from(Table.Users)
      .where({email})
      .limit(1);

    return completeAuth(user.id, {
      request,
      redirectTo: redirectTo ?? undefined,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    restartSignIn({request});
  }
}

export async function createAccountFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);

  if (token == null) {
    return restartCreateAccount({request});
  }

  try {
    const {
      subject: email,
      data: {redirectTo},
      expired,
    } = verifySignedToken<{
      redirectTo?: string | null;
    }>(token);

    if (email == null) {
      restartCreateAccount({
        request,
        redirectTo: redirectTo ?? undefined,
      });
    }

    if (expired) {
      restartCreateAccount({
        request,
        reason: CreateAccountErrorReason.Expired,
        redirectTo: redirectTo ?? undefined,
      });
    }

    const user = await db.transaction(async (trx) => {
      const [existingUser] = await trx
        .select(['id'])
        .from(Table.Users)
        .where({email})
        .limit(1);

      if (existingUser) {
        // eslint-disable-next-line no-console
        console.log(`Found existing user with email: ${email}`);
        return existingUser;
      }

      const [newUser] = await trx
        .insert({email})
        .into(Table.Users)
        .returning(['id']);

      // eslint-disable-next-line no-console
      console.log(`Created a new user for email: ${email}`);

      return newUser;
    });

    // eslint-disable-next-line no-console
    console.log(
      `Finished account creation for user with email: ${email}, redirect to: ${redirectTo}`,
    );

    return completeAuth(user.id, {
      request,
      redirectTo: redirectTo ?? undefined,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    restartCreateAccount({request});
  }
}
