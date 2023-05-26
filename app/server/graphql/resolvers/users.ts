import Env from '@quilted/quilt/env';
import type {
  PrismaClient,
  User as DatabaseUser,
  GithubAccount as DatabaseGithubAccount,
  GoogleAccount as DatabaseGoogleAccount,
  PersonalAccessToken as DatabasePersonalAccessToken,
  Passkey as DatabasePasskey,
  StripeSubscription,
} from '@prisma/client';
import {customAlphabet} from 'nanoid';
import type {Stripe} from 'stripe';

import {
  SUBSCRIPTION_LEVELS,
  SubscriptionLevel,
} from '~/global/subscriptions.ts';

import {
  createSignedToken,
  removeAuthCookies,
  addAuthCookies,
} from '../../shared/auth.ts';

import type {Resolver, QueryResolver, MutationResolver} from './types.ts';
import {toGid, fromGid} from './shared/id.ts';
import {enqueueSendEmail} from './shared/email.ts';

const PASSKEY_CHALLENGE_COOKIE = 'PasskeyChallenge';

declare module './types' {
  export interface ValueMap {
    User: DatabaseUser;
    Subscription: StripeSubscription;
    GithubAccount: DatabaseGithubAccount;
    GoogleAccount: DatabaseGoogleAccount;
    PersonalAccessToken: DatabasePersonalAccessToken;
    Passkey: DatabasePasskey;
  }
}

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    STRIPE_API_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
  }
}

export const Query: Pick<QueryResolver, 'me' | 'my'> = {
  me(_, __, {prisma, user}) {
    return prisma.user.findFirst({
      where: {id: user.id},
      rejectOnNotFound: true,
    });
  },
  my(_, __, {prisma, user}) {
    return prisma.user.findFirst({
      where: {id: user.id},
      rejectOnNotFound: true,
    });
  },
};

export const User: Resolver<'User'> = {
  id: ({id}) => toGid(id, 'User'),
  role: ({role}) => role,
  level: ({level}) => level,
  githubAccount({id}, _, {prisma}) {
    return prisma.githubAccount.findFirst({
      where: {userId: id},
    });
  },
  googleAccount({id}, _, {prisma}) {
    return prisma.googleAccount.findFirst({
      where: {userId: id},
    });
  },
  accessTokens({id}, _, {user, prisma}) {
    if (user.id !== id) {
      throw new Error();
    }

    return prisma.personalAccessToken.findMany({
      where: {userId: user.id},
      take: 50,
    });
  },
  settings({spoilerAvoidance}) {
    return {
      spoilerAvoidance,
    };
  },
  passkeys({id}, _, {prisma}) {
    return prisma.passkey.findMany({
      where: {userId: id},
    });
  },
  async giftCode({id}, _, {prisma}) {
    const giftCode = await prisma.accountGiftCode.findFirst({
      where: {redeemedById: id},
    });

    if (giftCode == null) return null;

    return {
      code: giftCode.code,
      redeemedAt: giftCode.redeemedAt!.toISOString(),
    };
  },
  subscription({id}, _, {prisma}) {
    return prisma.stripeSubscription.findFirst({
      where: {userId: id},
    });
  },
};

export const Subscription: Resolver<'Subscription'> = {
  id: ({id}) => toGid(id, 'Subscription'),
  startedAt: ({startedAt}) => startedAt?.toISOString() ?? null,
  endedAt: ({endedAt}) => endedAt?.toISOString() ?? null,
  paymentFlow: ({paymentFlow}) => {
    return paymentFlow
      ? {
          apiKey: Env.STRIPE_PUBLISHABLE_KEY,
          level: (paymentFlow as any).level,
          clientSecret: (paymentFlow as any).clientSecret,
        }
      : null;
  },
};

export const Passkey: Resolver<'Passkey'> = {
  id: ({id}) => toGid(id, 'Passkey'),
};

export const PersonalAccessToken: Resolver<'PersonalAccessToken'> = {
  id: ({id}) => toGid(id, 'PersonalAccessToken'),
  prefix: () => PERSONAL_ACCESS_TOKEN_PREFIX,
  length: ({token}) => token.length,
  lastFourCharacters: ({token}) => token.slice(-4),
};

export const GithubAccount: Resolver<'GithubAccount'> = {
  avatarImage: ({avatarUrl}) => {
    return avatarUrl ? {source: avatarUrl} : null;
  },
};

export const GoogleAccount: Resolver<'GoogleAccount'> = {
  id: ({id}) => toGid(id, 'GoogleAccount'),
  image: ({imageUrl}) => {
    return imageUrl ? {source: imageUrl} : null;
  },
};

const PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH = 12;
const PERSONAL_ACCESS_TOKEN_PREFIX = 'wlp_';

// @see https://github.com/CyberAP/nanoid-dictionary#nolookalikes
const createCode = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXY', 8);

export const Mutation: Pick<
  MutationResolver,
  | 'createAccount'
  | 'deleteAccount'
  | 'createAccountGiftCode'
  | 'redeemAccountGiftCode'
  | 'signIn'
  | 'signOut'
  | 'prepareSubscription'
  | 'cancelSubscription'
  | 'updateUserSettings'
  | 'disconnectGithubAccount'
  | 'disconnectGoogleAccount'
  | 'createPersonalAccessToken'
  | 'deletePersonalAccessToken'
  | 'deletePasskey'
  | 'startPasskeyCreate'
  | 'finishPasskeyCreate'
  | 'startPasskeySignIn'
  | 'finishPasskeySignIn'
> = {
  async signIn(_, {email, redirectTo}, {prisma, request}) {
    const user = await prisma.user.findFirst({where: {email}});

    if (user == null) {
      // Need to make this take roughly the same amount of time as
      // enqueuing a message, which can sometimes take a long time...
      return {email};
    }

    await enqueueSendEmail(
      'signIn',
      {
        token: await createSignedToken(
          {redirectTo},
          {subject: email, expiresIn: '15 minutes'},
        ),
        userEmail: email,
      },
      {request},
    );

    return {email};
  },
  async signOut(_, __, {user, response, request}) {
    removeAuthCookies(response, {request});
    return {userId: toGid(user.id, 'User')};
  },
  async createAccount(_, {email, code, redirectTo}, {prisma, request}) {
    const user = await prisma.user.findFirst({
      where: {email},
      select: {id: true},
    });

    if (user != null) {
      await enqueueSendEmail(
        'signIn',
        {
          token: await createSignedToken(
            {giftCode: code, redirectTo},
            {subject: email, expiresIn: '15 minutes'},
          ),
          userEmail: email,
        },
        {request},
      );

      return {email};
    }

    await enqueueSendEmail(
      'welcome',
      {
        token: await createSignedToken(
          {giftCode: code, redirectTo},
          {subject: email, expiresIn: '15 minutes'},
        ),
        userEmail: email,
      },
      {request},
    );

    return {email};
  },
  async deleteAccount(_, __, {prisma, user}) {
    const deleted = await prisma.user.delete({where: {id: user.id}});
    return {deletedId: toGid(deleted.id, 'User')};
  },
  async createAccountGiftCode(_, __, {prisma, user}) {
    const {role} = await prisma.user.findFirstOrThrow({
      where: {id: user.id},
    });

    if (role !== 'ADMIN') {
      throw new Error(`Can’t create an account gift code`);
    }

    const {code} = await prisma.accountGiftCode.create({
      data: {
        code: createCode(),
      },
    });

    return {
      code,
    };
  },
  async prepareSubscription(_, {level}, {prisma, user}) {
    const {default: Stripe} = await import('stripe');

    const stripe = new Stripe(Env.STRIPE_API_KEY, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const existingSubscription = await prisma.stripeSubscription.findFirst({
      where: {userId: user.id},
    });

    const {email} = await prisma.user.findFirstOrThrow({
      where: {id: user.id},
    });

    const price =
      SUBSCRIPTION_LEVELS[level.toUpperCase() as SubscriptionLevel]
        .stripePriceId;

    let subscription = existingSubscription;

    const getSecret = (subscription: Stripe.Subscription) => {
      return (
        (
          (subscription.latest_invoice as Stripe.Invoice)
            ?.payment_intent as Stripe.PaymentIntent
        )?.client_secret ?? undefined
      );
    };

    if (subscription == null) {
      const customer = await stripe.customers.create({
        email,
        metadata: {userId: user.id},
      });

      const stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{price}],
        payment_behavior: 'default_incomplete',
        payment_settings: {save_default_payment_method: 'on_subscription'},
        expand: ['latest_invoice.payment_intent'],
        metadata: {level, userId: user.id},
      });

      const secret = getSecret(stripeSubscription);

      const subscription = await prisma.stripeSubscription.create({
        data: {
          level,
          priceId: price,
          userId: user.id,
          customerId: customer.id,
          subscriptionId: stripeSubscription.id,
          paymentFlow: {level, clientSecret: secret},
        },
      });

      await updateUserWithSubscription(subscription, prisma);

      return {subscription};
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.subscriptionId,
      {
        expand: ['latest_invoice.payment_intent'],
      },
    );

    if (
      stripeSubscription.status === 'canceled' ||
      stripeSubscription.status === 'incomplete_expired' ||
      stripeSubscription.items.data[0]?.price.id !== price
    ) {
      const newStripeSubscription = await stripe.subscriptions.create({
        customer: subscription.customerId,
        items: [{price}],
        payment_behavior: 'default_incomplete',
        payment_settings: {save_default_payment_method: 'on_subscription'},
        metadata: {level, userId: user.id},
        expand: ['latest_invoice.payment_intent'],
      });

      const active = newStripeSubscription.status === 'active';

      subscription = await prisma.stripeSubscription.update({
        data: active
          ? {
              level,
              status: 'ACTIVE',
              priceId: price,
              paymentFlow: undefined,
              subscriptionId: newStripeSubscription.id,
              startedAt: new Date(),
              endedAt: undefined,
            }
          : {
              status: 'INACTIVE',
              paymentFlow: {
                level,
                clientSecret: getSecret(newStripeSubscription),
              },
              subscriptionId: newStripeSubscription.id,
            },
        where: {
          id: subscription.id,
        },
      });
    }

    await updateUserWithSubscription(subscription, prisma);

    return {
      subscription,
    };
  },
  async cancelSubscription(_, __, {prisma, user}) {
    const subscription = await prisma.stripeSubscription.findFirst({
      where: {userId: user.id},
    });

    if (subscription == null) {
      return {subscription: null};
    }

    const {default: Stripe} = await import('stripe');

    const stripe = new Stripe(Env.STRIPE_API_KEY, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const deleteResult = await stripe.subscriptions.del(
      subscription.subscriptionId,
      {
        prorate: true,
      },
    );

    // eslint-disable-next-line no-console
    console.log(deleteResult);

    const updatedSubscription = await prisma.stripeSubscription.update({
      where: {id: subscription.id},
      data: {
        status: 'INACTIVE',
        endedAt: new Date(),
        paymentFlow: undefined,
      },
    });

    await updateUserWithSubscription(updatedSubscription, prisma);

    return {subscription: updatedSubscription};
  },
  async redeemAccountGiftCode(_, {code}, {prisma, user}) {
    const [giftCode, existingCodeForUser] = await Promise.all([
      prisma.accountGiftCode.findFirst({
        where: {code},
      }),
      prisma.accountGiftCode.findFirst({
        where: {redeemedById: user.id},
      }),
    ]);

    if (giftCode == null) {
      // eslint-disable-next-line no-console
      console.log(`Could not find gift code ${code} for user ${user.id}`);

      return {giftCode: null};
    }

    if (giftCode.redeemedById != null) {
      // eslint-disable-next-line no-console
      console.log(`Gift code ${code} has already been used`);

      return {giftCode: null};
    }

    if (existingCodeForUser != null) {
      // eslint-disable-next-line no-console
      console.log(`User ${user.id} already has applied a gift code`);

      return {giftCode: null};
    }

    const [updatedGiftCode] = await prisma.$transaction([
      prisma.accountGiftCode.update({
        where: {id: giftCode.id},
        data: {redeemedById: user.id, redeemedAt: new Date()},
      }),
      prisma.user.update({where: {id: user.id}, data: {level: 'PATRON'}}),
    ]);

    return {
      giftCode: {
        code: updatedGiftCode.code,
        redeemedAt: updatedGiftCode.redeemedAt!.toISOString(),
      },
    };
  },
  async disconnectGithubAccount(_, __, {prisma, user}) {
    const githubAccount = await prisma.githubAccount.findFirst({
      where: {userId: user.id},
    });

    if (githubAccount) {
      await prisma.githubAccount.delete({where: {id: githubAccount.id}});
    }

    return {deletedAccount: githubAccount};
  },
  async disconnectGoogleAccount(_, __, {prisma, user}) {
    const googleAccount = await prisma.googleAccount.findFirst({
      where: {userId: user.id},
    });

    if (googleAccount) {
      await prisma.googleAccount.delete({where: {id: googleAccount.id}});
    }

    return {
      deletedAccountId:
        googleAccount && toGid(googleAccount.id, 'GoogleAccount'),
    };
  },
  async updateUserSettings(_, {spoilerAvoidance}, {user: {id}, prisma}) {
    const data: Parameters<typeof prisma['user']['update']>[0]['data'] = {};

    if (spoilerAvoidance != null) {
      data.spoilerAvoidance = spoilerAvoidance;
    }

    const user = await prisma.user.update({
      data,
      where: {
        id,
      },
    });

    return {user};
  },
  async createPersonalAccessToken(_, {label}, {user, prisma}) {
    const {randomBytes} = await import('crypto');

    const token = `${PERSONAL_ACCESS_TOKEN_PREFIX}${randomBytes(
      PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH,
    )
      .toString('hex')
      .slice(0, PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH)}`;

    const personalAccessToken = await prisma.personalAccessToken.create({
      data: {
        token,
        label,
        userId: user.id,
      },
    });

    return {personalAccessToken, plaintextToken: token};
  },
  async deletePersonalAccessToken(
    _,
    {id, token: plaintextToken},
    {user, prisma},
  ) {
    const token = await prisma.personalAccessToken.findFirst({
      where: {
        id: id ? fromGid(id).id : undefined,
        token: plaintextToken ?? undefined,
        userId: user.id,
      },
    });

    if (token) {
      await prisma.personalAccessToken.delete({where: {id: token.id}});
    }

    return {deletedPersonalAccessTokenId: token?.id ?? null};
  },
  async startPasskeyCreate(_, __, {prisma, user, request, response}) {
    const {generateRegistrationOptions} = await import(
      '@simplewebauthn/server'
    );

    const {email} = await prisma.user.findFirstOrThrow({
      where: {id: user.id},
    });

    const result = generateRegistrationOptions({
      rpID: new URL(request.url).host,
      rpName: 'Watch',
      userID: user.id,
      userName: email,
      attestationType: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    response.cookies.set(PASSKEY_CHALLENGE_COOKIE, result.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 1000,
    });

    return {
      result: JSON.stringify(result),
    };
  },
  async finishPasskeyCreate(
    _,
    {credential},
    {user, prisma, request, response},
  ) {
    try {
      const cookie = request.cookies.get(PASSKEY_CHALLENGE_COOKIE);

      if (cookie == null) {
        throw new Error('No challenge cookie');
      }

      const {verifyRegistrationResponse} = await import(
        '@simplewebauthn/server'
      );

      const {origin, host} = new URL(request.url);

      const parsedPasskey = JSON.parse(credential);

      const result = await verifyRegistrationResponse({
        credential: parsedPasskey,
        expectedChallenge: cookie,
        expectedOrigin: origin,
        expectedRPID: host,
        requireUserVerification: true,
      });

      if (!result.verified || result.registrationInfo == null) {
        throw new Error('Could not verify challenge');
      }

      const {registrationInfo} = result;

      const {user: updatedUser, ...passkeyResult} = await prisma.passkey.create(
        {
          data: {
            counter: registrationInfo.counter,
            credentialId: registrationInfo.credentialID,
            publicKey: registrationInfo.credentialPublicKey,
            transports: parsedPasskey.transports,
            userId: user.id,
          },
          include: {user: true},
        },
      );

      return {user: updatedUser, passkey: passkeyResult};
    } finally {
      response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    }
  },
  async startPasskeySignIn(_, {email}, {prisma, request, response}) {
    const {generateAuthenticationOptions} = await import(
      '@simplewebauthn/server'
    );

    const passkeys = email
      ? await prisma.passkey.findMany({
          take: 5,
          where: {
            user: {email},
          },
        })
      : [];

    const result = generateAuthenticationOptions({
      rpID: new URL(request.url).host,
      userVerification: 'required',
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        type: 'public-key',
        transports:
          Array.isArray(passkey.transports) && typeof passkeys[0] === 'string'
            ? (passkey.transports as any[])
            : undefined,
      })),
    });

    response.cookies.set(PASSKEY_CHALLENGE_COOKIE, result.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 1000,
    });

    return {
      result: JSON.stringify(result),
    };
  },
  async finishPasskeySignIn(_, {credential}, {prisma, request, response}) {
    try {
      const cookie = request.cookies.get(PASSKEY_CHALLENGE_COOKIE);

      if (cookie == null) {
        throw new Error('No challenge cookie');
      }

      const {origin, host} = new URL(request.url);
      const credentialJson = JSON.parse(credential);

      const [{default: base64url}, {verifyAuthenticationResponse}] =
        await Promise.all([
          import('base64url'),
          import('@simplewebauthn/server'),
        ]);

      const passkey = await prisma.passkey.findFirstOrThrow({
        where: {
          credentialId: base64url.toBuffer(credentialJson.rawId),
        },
      });

      const result = await verifyAuthenticationResponse({
        credential: credentialJson,
        expectedChallenge: cookie,
        expectedOrigin: origin,
        expectedRPID: host,
        requireUserVerification: true,
        authenticator: {
          counter: passkey.counter,
          credentialID: passkey.credentialId,
          credentialPublicKey: passkey.publicKey,
        },
      });

      if (!result.verified || result.authenticationInfo == null) {
        throw new Error('Could not verify challenge');
      }

      const {authenticationInfo} = result;

      const [updatedPasskey] = await Promise.all([
        prisma.passkey.update({
          where: {id: passkey.id},
          data: {counter: authenticationInfo.newCounter},
          include: {user: true},
        }),
        addAuthCookies({id: passkey.userId}, response),
      ]);

      return {
        user: updatedPasskey.user,
        passkey: updatedPasskey,
      };
    } finally {
      response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    }
  },
  async deletePasskey(_, {id}, {user, prisma}) {
    const passkey = await prisma.passkey.findFirstOrThrow({
      where: {
        id: fromGid(id).id,
        userId: user.id,
      },
    });

    const {user: updatedUser} = await prisma.passkey.delete({
      where: {id: passkey.id},
      select: {user: true},
    });

    return {deletedPasskeyId: passkey.id, user: updatedUser};
  },
};

async function updateUserWithSubscription(
  subscription: StripeSubscription,
  prisma: PrismaClient,
) {
  const user = await prisma.user.findFirstOrThrow({
    where: {id: subscription.userId},
    include: {giftCodes: {take: 1}},
  });

  const level =
    user.giftCodes.length > 0
      ? user.level
      : subscription.status === 'ACTIVE'
      ? subscription.level
      : 'FREE';

  if (level !== user.level) {
    await prisma.user.update({
      where: {id: user.id},
      data: {level},
    });
  }
}
