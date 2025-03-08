import {test, expect} from '@playwright/test';

import {AppURL, AppTestRunner} from './shared/runner.ts';

test.describe('authentication', () => {
  test('an unauthenticated user is redirected to sign in', async ({page}) => {
    const targetURL = new AppURL('/app');
    const expectedURL = new AppURL('/sign-in');
    expectedURL.searchParams.set('redirect', targetURL.href);

    const runner = new AppTestRunner(page);

    await runner.goto(targetURL);

    await expect(page).toHaveURL(expectedURL.href);
  });
});
