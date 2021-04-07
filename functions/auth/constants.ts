export const ROOT_PATH = '/internal/auth';

export enum SearchParam {
  Token = 'token',
  Reason = 'reason',
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
