import {test, expect} from '@playwright/test';

import {navigate} from '../shared/navigate.ts';
import {createAccount} from '../shared/user.ts';

test.describe('create account', () => {
  test('the heading title shows a preview commit', async ({page}) => {
    await navigate(page, {to: '/'});

    await expect(
      page.getByText(`What are we watching next? (from preview)`),
    ).toBeVisible();
  });

  test('a user can create an account', async ({page}) => {
    const {email} = await createAccount(page);

    await page.getByRole('link', {name: /me/i}).click();

    await expect(page.getByText(`Email: ${email}`)).toBeVisible();
  });
});
