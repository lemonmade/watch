import {test, expect} from '@playwright/test';

import {AppURL, navigate} from './shared/navigate.ts';
import {createAccount} from './shared/user.ts';

test.describe('authentication', () => {
  test('an unauthenticated user is redirected to sign in', async ({page}) => {
    const targetURL = new AppURL('/app');
    const expectedURL = new AppURL('/sign-in');
    expectedURL.searchParams.set('redirect', targetURL.href);

    await navigate(page, targetURL);

    await expect(page).toHaveURL(expectedURL.href);
  });

  test('a user can create an account', async ({page}) => {
    const {email} = await createAccount(page);

    await page.getByRole('link', {name: /me/i}).click();

    await expect(page.getByText(`Email: ${email}`)).toBeVisible();
  });
});
