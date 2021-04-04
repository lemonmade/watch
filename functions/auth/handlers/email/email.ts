import {redirect} from '@lemon/tiny-server';
import type {ExtendedRequest} from '@lemon/tiny-server';

import {
  // addAuthCookies,
  verifySignedToken,
} from 'shared/utilities/auth';
import {createDatabaseConnection, Table} from 'shared/utilities/database';

import {completeAuth, restartAuth} from '../shared';
import {SearchParam} from '../../constants';

const db = createDatabaseConnection();

export async function signInFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);
  if (token == null) return restartAuth({request});

  try {
    const {
      subject: email,
      data: {redirectTo},
      expired,
    } = verifySignedToken<{
      redirectTo?: string | null;
    }>(token);

    if (email == null || expired) {
      restartAuth({request, redirectTo: redirectTo ?? undefined});
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
    restartAuth({request});
  }
}

export function signUpFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);
  const redirectTo =
    request.url.searchParams.get(SearchParam.RedirectTo) ?? '/app';

  // eslint-disable-next-line no-console
  console.log({token});

  return redirect(redirectTo);
}
