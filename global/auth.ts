export enum SearchParam {
  Token = 'token',
  Reason = 'reason',
  Strategy = 'strategy',
  RedirectTo = 'redirect',
  GiftCode = 'gift-code',
}

export enum SignInErrorReason {
  Expired = 'expired',
  Generic = 'generic-error',
  GithubError = 'github-error',
  GithubNoAccount = 'github-no-account',
  GoogleError = 'google-error',
  GoogleNoAccount = 'google-no-account',
}

export enum CreateAccountErrorReason {
  Expired = 'expired',
  Generic = 'generic-error',
  GithubError = 'github-error',
  GoogleError = 'google-error',
}

export enum GithubOAuthFlow {
  SignIn,
  CreateAccount,
  Connect,
}

export enum GoogleOAuthFlow {
  SignIn,
  CreateAccount,
  Connect,
}

export const GITHUB_OAUTH_MESSAGE_TOPIC = 'github:oauth';
export const GOOGLE_OAUTH_MESSAGE_TOPIC = 'google:oauth';

export type GithubOAuthMessage =
  | {
      topic: typeof GITHUB_OAUTH_MESSAGE_TOPIC;
      flow: GithubOAuthFlow.SignIn;
      success: boolean;
      redirectTo: string;
      reason?: SignInErrorReason;
    }
  | {
      topic: typeof GITHUB_OAUTH_MESSAGE_TOPIC;
      flow: GithubOAuthFlow.CreateAccount;
      success: boolean;
      redirectTo: string;
      reason?: CreateAccountErrorReason;
    }
  | {
      topic: typeof GITHUB_OAUTH_MESSAGE_TOPIC;
      flow: GithubOAuthFlow.Connect;
      success: boolean;
      redirectTo?: never;
      reason?: never;
    };

export type GoogleOAuthMessage =
  | {
      topic: typeof GOOGLE_OAUTH_MESSAGE_TOPIC;
      flow: GoogleOAuthFlow.SignIn;
      success: boolean;
      redirectTo: string;
      reason?: SignInErrorReason;
    }
  | {
      topic: typeof GOOGLE_OAUTH_MESSAGE_TOPIC;
      flow: GoogleOAuthFlow.CreateAccount;
      success: boolean;
      redirectTo: string;
      reason?: CreateAccountErrorReason;
    }
  | {
      topic: typeof GOOGLE_OAUTH_MESSAGE_TOPIC;
      flow: GoogleOAuthFlow.Connect;
      success: boolean;
      redirectTo?: never;
      reason?: never;
    };
