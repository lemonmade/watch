import crypto from 'crypto';
import {
  RedirectResponse,
  HTMLResponse,
  EnhancedResponse,
  type EnhancedRequest,
  type CookieOptions,
} from '@quilted/quilt/request-router';
import {stripIndent} from 'common-tags';
import type {ContextVariableMap} from 'hono';

import {
  SearchParam,
  SignInErrorReason,
  CreateAccountErrorReason,
  GOOGLE_OAUTH_MESSAGE_TOPIC,
  GoogleOAuthFlow,
  type GoogleOAuthMessage,
} from '~/global/auth.ts';
import {createSignedToken, verifySignedToken} from '~/global/tokens.ts';
import type {Environment} from '../../context.ts';

import {getUserIdFromRequest, addAuthCookies} from '../../shared/auth.ts';
import {createAccountWithGiftCode} from '../../shared/create-account.ts';
import {createResponseHandler} from '../../shared/response.ts';

import {validateRedirectTo} from '../shared.ts';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  }
}

const SCOPES = 'email profile';

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: 60 * 5,
  sameSite: 'lax',
  secure: true,
  httpOnly: true,
};

enum Cookie {
  State = 'GoogleOAuthState',
}

enum GoogleSearchParam {
  Code = 'code',
  Scope = 'scope',
  State = 'state',
  ClientId = 'client_id',
  Redirect = 'redirect_uri',
  ResponseType = 'response_type',
}

interface GoogleOAuthStateToken {
  nonce: string;
  redirectTo?: string;
}

export async function startGoogleOAuth<State extends {} = {}>(
  request: EnhancedRequest,
  {
    env,
    getState,
  }: {env: Environment; getState?(): void | State | Promise<void | State>},
) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get(SearchParam.RedirectTo);
  const state = await createSignedToken(
    {
      nonce: crypto
        .randomBytes(15)
        .map((byte) => byte % 10)
        .join(''),
      redirectTo,
      ...(getState ? ((await getState()) ?? {}) : {}),
    },
    {secret: env.GOOGLE_CLIENT_SECRET, expiresIn: 15 * 60 * 1_000},
  );

  const googleOAuthUrl = new URL(
    'https://accounts.google.com/o/oauth2/v2/auth',
  );
  googleOAuthUrl.searchParams.set(GoogleSearchParam.ResponseType, 'code');
  googleOAuthUrl.searchParams.set(
    GoogleSearchParam.ClientId,
    env.GOOGLE_CLIENT_ID,
  );
  googleOAuthUrl.searchParams.set(GoogleSearchParam.Scope, SCOPES);
  googleOAuthUrl.searchParams.set(GoogleSearchParam.State, state);

  const callbackUrl = new URL('callback', `${url.origin}${url.pathname}/`);

  googleOAuthUrl.searchParams.set(GoogleSearchParam.Redirect, callbackUrl.href);

  const response = new RedirectResponse(googleOAuthUrl, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });

  const cookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    path: url.pathname,
  };

  response.cookies.set(Cookie.State, state, cookieOptions);

  return response;
}

export const handleStartGoogleOAuth = createResponseHandler(
  async function handleStartGoogleOAuth(request, {env}) {
    return startGoogleOAuth(request, {env});
  },
);

export const handleGoogleOAuthSignIn = createResponseHandler(
  async function handleGoogleOAuthSignIn(
    request,
    {env, var: {prisma: prismaContext}},
  ) {
    return handleGoogleOAuthCallback(request, {
      env,
      prisma: prismaContext,
      onFailure({request, redirectTo}) {
        return restartSignIn({
          request,
          redirectTo,
          reason: SignInErrorReason.GoogleError,
        });
      },
      onSuccess({userIdFromExistingAccount, redirectTo}) {
        if (userIdFromExistingAccount) {
          console.log(
            `Found existing user during sign-in: ${userIdFromExistingAccount}`,
          );

          return completeSignIn(userIdFromExistingAccount, {
            env,
            redirectTo,
            request,
          });
        } else {
          console.log(`No user found!`);

          return restartSignIn({
            request,
            redirectTo,
            reason: SignInErrorReason.GoogleNoAccount,
          });
        }
      },
    });
  },
);

function completeSignIn(
  userId: string,
  {
    env,
    request,
    redirectTo,
  }: {env: Environment; request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GoogleOAuthFlow.SignIn, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
    {env},
  );
}

interface CreateAccountState {
  giftCode?: string;
}

export const handleStartGoogleOAuthCreateAccount = createResponseHandler(
  async function handleStartGoogleOAuthCreateAccount(request, {env}) {
    return startGoogleOAuth<CreateAccountState>(request, {
      env,
      getState() {
        const giftCode = new URL(request.url).searchParams.get(
          SearchParam.GiftCode,
        );

        return giftCode ? {giftCode} : {};
      },
    });
  },
);

export const handleGoogleOAuthCreateAccount = createResponseHandler(
  async function handleGoogleOAuthCreateAccount(
    request,
    {env, var: {prisma: prismaContext}},
  ) {
    return handleGoogleOAuthCallback<CreateAccountState>(request, {
      env,
      prisma: prismaContext,
      onFailure({request, state, redirectTo}) {
        return restartCreateAccount({
          request,
          redirectTo,
          giftCode: state?.giftCode,
          reason: CreateAccountErrorReason.GoogleError,
        });
      },
      async onSuccess({
        state,
        redirectTo,
        googleAccount,
        userIdFromExistingAccount,
      }) {
        if (userIdFromExistingAccount) {
          console.log(
            `Found existing user during sign-up: ${userIdFromExistingAccount}`,
          );

          return completeCreateAccount(userIdFromExistingAccount, {
            env,
            request,
            redirectTo,
          });
        }

        const {id: googleUserId, email, imageUrl} = googleAccount;

        try {
          const prisma = await prismaContext.load();

          const googleAccount = {
            id: googleUserId,
            email,
            imageUrl,
          };

          // Don’t try to be clever here and give feedback to the user if
          // this failed because their email already exists. It’s tempting
          // to just log them in or tell them they have an account already,
          // but that feedback could be used to probe for emails.
          const {id: updatedUserId} = state.giftCode
            ? await createAccountWithGiftCode(
                {
                  email,
                  googleAccount: {create: googleAccount},
                },
                {giftCode: state.giftCode, prisma},
              )
            : await prisma.user.create({
                data: {
                  email,
                  googleAccount: {create: googleAccount},
                },
              });

          console.log(`Created new user during sign-up: ${updatedUserId}`);

          return completeCreateAccount(updatedUserId, {
            env,
            redirectTo,
            request,
          });
        } catch {
          return restartCreateAccount({redirectTo, request});
        }
      },
    });
  },
);

function completeCreateAccount(
  userId: string,
  {
    env,
    request,
    redirectTo,
  }: {env: Environment; request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GoogleOAuthFlow.CreateAccount, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
    {env},
  );
}

export const handleGoogleOAuthConnect = createResponseHandler(
  async function handleGoogleOAuthConnect(
    request,
    {env, var: {prisma: prismaContext}},
  ) {
    return handleGoogleOAuthCallback(request, {
      env,
      prisma: prismaContext,
      onFailure({request, redirectTo}) {
        return restartConnect({redirectTo, request});
      },
      async onSuccess({userIdFromExistingAccount, redirectTo, googleAccount}) {
        const userIdFromRequest = await getUserIdFromRequest(request, {env});

        if (userIdFromExistingAccount) {
          if (userIdFromRequest === userIdFromExistingAccount) {
            console.log(
              `Found existing Google account while connecting (user: ${userIdFromExistingAccount})`,
            );

            return completeConnect(userIdFromRequest, {
              env,
              request,
              redirectTo,
            });
          } else {
            console.log(
              `Attempted to connect a Google account to user ${userIdFromRequest}, but that account is already connected to user ${userIdFromExistingAccount}`,
            );

            return restartConnect({request, redirectTo});
          }
        }

        // We are trying to connect, but there is no user signed in!
        if (userIdFromRequest == null) {
          return restartSignIn({redirectTo, request});
        }

        const {id: googleUserId, email, imageUrl} = googleAccount;

        try {
          const prisma = await prismaContext.load();

          await prisma.googleAccount.create({
            data: {
              id: googleUserId,
              userId: userIdFromRequest,
              email,
              imageUrl,
            },
          });

          console.log(
            `Connected Google account ${email} to user: ${userIdFromRequest}`,
          );

          return completeConnect(userIdFromRequest, {
            env,
            request,
            redirectTo,
          });
        } catch {
          // Should have better behavior here, what do we do if
          // the db request to connect the account failed? Probably
          // need a URL param for the next page to pick up
          return restartConnect({request, redirectTo});
        }
      },
    });
  },
);

function completeConnect(
  userId: string,
  {
    env,
    request,
    redirectTo,
  }: {
    env: Environment;
    request: EnhancedRequest;
    redirectTo?: string;
  },
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GoogleOAuthFlow.Connect, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
    {env},
  );
}

interface GoogleAccount {
  readonly id: string;
  readonly email: string;
  readonly imageUrl?: string;
}

interface GoogleTokenInfoResponse {
  sub: string;
  exp: string;
  email: string;
  picture?: string;
}

interface GoogleCallbackResult<State extends {} = {}> {
  readonly googleAccount: GoogleAccount;
  readonly state: State;
  readonly redirectTo?: string;
  readonly userIdFromExistingAccount?: string;
}

enum GoogleCallbackFailureReason {
  StateMismatch,
  FailedToFetchUser,
}

interface GoogleCallbackFailureResult<State extends {} = {}> {
  readonly request: EnhancedRequest;
  readonly reason: GoogleCallbackFailureReason;
  readonly state?: State;
  readonly redirectTo?: string;
}

async function handleGoogleOAuthCallback<State extends {} = {}>(
  request: EnhancedRequest,
  {
    env,
    onSuccess,
    onFailure,
    prisma: prismaContext,
  }: {
    env: Environment;
    onSuccess(
      result: GoogleCallbackResult<State>,
    ): Response | Promise<Response>;
    onFailure(result: GoogleCallbackFailureResult<State>): EnhancedResponse;
  } & Pick<ContextVariableMap, 'prisma'>,
) {
  const url = new URL(request.url);
  const {cookies} = request;

  const expectedState = cookies.get(Cookie.State);
  const code = url.searchParams.get(GoogleSearchParam.Code);
  const state = url.searchParams.get(GoogleSearchParam.State);

  if (expectedState == null || expectedState !== state) {
    return onFailure({
      reason: GoogleCallbackFailureReason.StateMismatch,
      request,
    });
  }

  const {expired, data} = await verifySignedToken<
    GoogleOAuthStateToken & State
  >(state, {
    secret: env.GOOGLE_CLIENT_SECRET,
  });

  const redirectTo = data?.redirectTo;

  if (expired || data == null) {
    return onFailure({
      reason: GoogleCallbackFailureReason.StateMismatch,
      state: data ?? undefined,
      request,
      redirectTo,
    });
  }

  const redirectUri = new URL(url);
  redirectUri.search = '';

  const accessTokenResponse = await fetch(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri.href,
        code,
        state,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      // @see https://github.com/nodejs/node/issues/46221
      ...{duplex: 'half'},
    },
  );

  const accessTokenJson = (await accessTokenResponse.json()) as {
    id_token: string;
    access_token: string;
  };

  const accessTokenInfoUrl = new URL('https://oauth2.googleapis.com/tokeninfo');
  accessTokenInfoUrl.searchParams.set('id_token', accessTokenJson.id_token);

  const accessTokenInfo = (await (
    await fetch(accessTokenInfoUrl)
  ).json()) as GoogleTokenInfoResponse;

  const {sub, exp, email} = accessTokenInfo;

  if (sub == null || exp == null || Date.now() > Number.parseInt(exp) * 1_000) {
    console.log('No result fetched from Google!');
    return onFailure({
      request,
      state: data,
      redirectTo,
      reason: GoogleCallbackFailureReason.FailedToFetchUser,
    });
  }

  const googleAccount: GoogleAccount = {
    id: sub,
    email,
  };

  const prisma = await prismaContext.load();
  const account = await prisma.googleAccount.findUnique({
    where: {id: googleAccount.id},
    select: {userId: true},
  });

  const response = await onSuccess({
    state: data,
    googleAccount,
    redirectTo,
    userIdFromExistingAccount: account?.userId,
  });

  return response;
}

function restartSignIn({
  request,
  reason = SignInErrorReason.Generic,
  redirectTo,
}: {
  request: EnhancedRequest;
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

  return modalAuthResponse({
    request,
    redirectTo: signInUrl,
    event: {flow: GoogleOAuthFlow.SignIn, success: false, reason},
  });
}

function restartCreateAccount({
  request,
  reason = CreateAccountErrorReason.Generic,
  giftCode,
  redirectTo,
}: {
  request: EnhancedRequest;
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
    createAccountUrl.searchParams.set(SearchParam.GiftCode, giftCode);
  }

  return modalAuthResponse({
    request,
    redirectTo: createAccountUrl,
    event: {flow: GoogleOAuthFlow.CreateAccount, success: false, reason},
  });
}

function restartConnect({
  request,
  redirectTo,
}: {
  request: EnhancedRequest;
  redirectTo?: string;
}) {
  const targetUrl = validatedRedirectUrl(redirectTo, request);

  return modalAuthResponse({
    request,
    redirectTo: targetUrl,
    event: {flow: GoogleOAuthFlow.Connect, success: false},
  });
}

function validatedRedirectUrl(redirect: string | undefined, request: Request) {
  return new URL(validateRedirectTo(redirect, request) ?? '/app', request.url);
}

function modalAuthResponse({
  event,
  redirectTo,
  request,
}: {
  event: Omit<GoogleOAuthMessage, 'topic' | 'redirectTo'>;
  redirectTo: URL;
  request: EnhancedRequest;
}) {
  const content = stripIndent`
    <html>
      <script>
        try {
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(
              JSON.stringify({
                topic: GOOGLE_OAUTH_MESSAGE_TOPIC,
                redirectTo: redirectTo.href,
                ...event,
              }),
            )}, ${JSON.stringify(new URL(request.url).origin)})
          } else {
            window.location.replace(${JSON.stringify(redirectTo.href)});
          }
        } catch (error) {
          window.location.replace(${JSON.stringify(redirectTo.href)});
        }
      </script>
    </html>
  `;

  return deleteOAuthCookies(
    new HTMLResponse(content, {
      headers: {
        'Cache-Control': 'no-store',
      },
    }),
    {request},
  );
}

function deleteOAuthCookies(
  response: EnhancedResponse,
  {request}: {request?: EnhancedRequest},
) {
  if (request == null || request.cookies.has(Cookie.State)) {
    response.cookies.delete(Cookie.State);
  }

  return response;
}
