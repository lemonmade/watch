import {test, expect} from '@playwright/test';

import {AppURL, navigate} from '../shared/navigate.ts';

test.describe('sign in', () => {
  test('an unauthenticated user is redirected to sign in', async ({page}) => {
    const targetURL = new AppURL('/app');
    const expectedURL = new AppURL('/sign-in');
    expectedURL.searchParams.set('redirect', targetURL.href);

    await navigate(page, {to: targetURL});

    await expect(page).toHaveURL(expectedURL.href);
  });
});
