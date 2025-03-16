import {test, expect} from '@playwright/test';

import {createAccount} from '../shared/user.ts';

test.describe('create account', () => {
  test('a user can create an account', async ({page}) => {
    const {email} = await createAccount(page);

    await page.getByRole('link', {name: /me/i}).click();

    await expect(page.getByText(`Email: ${email}`)).toBeVisible();
  });
});
