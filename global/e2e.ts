export const E2E_TEST_CONTEXT_HEADER = 'Watch-Internal-E2E-Test';
export const E2E_TEST_ACCOUNT_EMAIL_SUFFIX = '@e2e.watch.lemon.tools';

export function isE2ETestAccountEmail(email: string) {
  return email.endsWith(E2E_TEST_ACCOUNT_EMAIL_SUFFIX);
}
