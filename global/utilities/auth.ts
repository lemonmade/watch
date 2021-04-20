export enum SearchParam {
  Token = 'token',
  Reason = 'reason',
  Strategy = 'strategy',
  RedirectTo = 'redirect',
}

export enum SignInErrorReason {
  Expired = 'expired',
  Generic = 'generic-error',
  GithubError = 'github-error',
  GithubNoAccount = 'github-no-account',
}

export enum CreateAccountErrorReason {
  Expired = 'expired',
  Generic = 'generic-error',
  GithubError = 'github-error',
}

export enum GithubOAuthFlow {
  SignIn,
  CreateAccount,
  Connect,
}

export const GITHUB_OAUTH_MESSAGE_TOPIC = 'github:oauth';

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
