import {
  AccountGiftCode,
  Query as AccountGiftCodeQuery,
  Mutation as AccountGiftCodeMutation,
} from './users/AccountGiftCode.ts';
import {
  User,
  Query as UserQuery,
  Mutation as UserMutation,
} from './users/User.ts';
import {Passkey, Mutation as PasskeyMutation} from './users/Passkey.ts';
import {
  GithubAccount,
  Mutation as GithubAccountMutation,
} from './users/GithubAccount.ts';
import {
  GoogleAccount,
  Mutation as GoogleAccountMutation,
} from './users/GoogleAccount.ts';
import {
  PersonalAccessToken,
  Mutation as PersonalAccessTokenMutation,
} from './users/PersonalAccessToken.ts';
import {
  Subscription,
  Mutation as SubscriptionMutation,
} from './users/Subscription.ts';

export {
  User,
  Passkey,
  Subscription,
  GithubAccount,
  GoogleAccount,
  AccountGiftCode,
  PersonalAccessToken,
};

export const Query = {...UserQuery, ...AccountGiftCodeQuery};

export const Mutation = {
  ...UserMutation,
  ...PasskeyMutation,
  ...SubscriptionMutation,
  ...GithubAccountMutation,
  ...GoogleAccountMutation,
  ...AccountGiftCodeMutation,
  ...PersonalAccessTokenMutation,
};
