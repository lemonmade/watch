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

export type GithubOAuthPopoverMessage =
  | {
      topic: 'github:oauth';
      type: 'signIn';
      success: boolean;
      redirectTo: string;
      reason?: SignInErrorReason;
    }
  | {
      topic: 'github:oauth';
      type: 'createAccount';
      success: boolean;
      redirectTo: string;
      reason?: CreateAccountErrorReason;
    }
  | {
      topic: 'github:oauth';
      type: 'connect';
      success: boolean;
      redirectTo?: never;
      reason?: never;
    };
