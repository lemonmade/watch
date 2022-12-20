import {redirect} from '@quilted/quilt/http-handlers';

import {
  SearchParam,
  SignInErrorReason,
  CreateAccountErrorReason,
} from '~/global/auth';

import {
  // addAuthCookies,
  verifySignedToken,
  addAuthCookies,
} from '../shared/auth';
import {createAccountWithGiftCode} from '../shared/create-account';
import {validateRedirectTo, createPrisma} from './shared';

export async function signInFromEmail(request: Request) {
  const token = new URL(request.url).searchParams.get(SearchParam.Token);

  if (token == null) {
    return restartSignIn({request});
  }

  try {
    const {
      subject: email,
      data: {redirectTo},
      expired,
    } = await verifySignedToken<{
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

    const prisma = await createPrisma();
    const user = await prisma.user.findFirst({where: {email}});

    if (user == null) {
      throw new Error(`No user found for email ${email}`);
    }

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

export async function createAccountFromEmail(request: Request) {
  const token = new URL(request.url).searchParams.get(SearchParam.Token);

  if (token == null) {
    return restartCreateAccount({request});
  }

  try {
    const {
      subject: email,
      data: {giftCode, redirectTo},
      expired,
    } = await verifySignedToken<{
      giftCode?: string;
      redirectTo?: string | null;
    }>(token);

    if (email == null) {
      return restartCreateAccount({
        request,
        giftCode,
        redirectTo: redirectTo ?? undefined,
      });
    }

    if (expired) {
      return restartCreateAccount({
        request,
        reason: CreateAccountErrorReason.Expired,
        giftCode,
        redirectTo: redirectTo ?? undefined,
      });
    }

    const prisma = await createPrisma();

    const user = giftCode
      ? await createAccountWithGiftCode({email}, {giftCode, prisma})
      : await prisma.user.create({
          data: {email},
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

export function completeAuth(
  userId: string,
  {
    request,
    redirectTo,
  }: {
    request: Request;
    redirectTo?: string;
  },
) {
  const redirectTarget = validateRedirectTo(redirectTo, request) ?? '/app';

  return addAuthCookies({id: userId}, redirect(redirectTarget));
}

export function restartSignIn({
  request,
  reason = SignInErrorReason.Generic,
  redirectTo,
}: {
  request: Request;
  reason?: SignInErrorReason;
  redirectTo?: string;
}) {
  const signInUrl = new URL('/sign-in', request.url);

  if (reason) {
    signInUrl.searchParams.set(SearchParam.Reason, reason);
  }

  const normalizedRedirectTo = validateRedirectTo(redirectTo, request);

  if (normalizedRedirectTo) {
    signInUrl.searchParams.set(SearchParam.RedirectTo, normalizedRedirectTo);
  }

  return redirect(signInUrl, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function restartCreateAccount({
  request,
  reason = CreateAccountErrorReason.Generic,
  giftCode,
  redirectTo,
}: {
  request: Request;
  reason?: CreateAccountErrorReason;
  giftCode?: string;
  redirectTo?: string;
}) {
  const createAccountUrl = new URL('/create-account', request.url);

  if (reason) {
    createAccountUrl.searchParams.set(SearchParam.Reason, reason);
  }

  const normalizedRedirectTo = validateRedirectTo(redirectTo, request);

  if (normalizedRedirectTo) {
    createAccountUrl.searchParams.set(
      SearchParam.RedirectTo,
      normalizedRedirectTo,
    );
  }

  if (giftCode) {
    createAccountUrl.searchParams.set('gift-code', giftCode);
  }

  return redirect(createAccountUrl, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
