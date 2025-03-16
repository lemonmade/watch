import {test, expect} from '@playwright/test';

import {navigate} from '../shared/navigate.ts';
import {createAccount} from '../shared/user.ts';

const SERIES_HANDLE = 'the-white-lotus-111803';

test.describe('watching', () => {
  test('a user can start a watchthrough for a single season', async ({
    page,
  }) => {
    await createAccount(page);

    await navigate(page, {to: `/app/series/${SERIES_HANDLE}`});

    // The first button is the series watch, which watches all seasons in a series
    await page.getByRole('button', {name: /watch/i}).nth(2).click();

    await expect(page).toHaveURL((url) =>
      url.pathname.startsWith('/app/watching/'),
    );
    await expect(
      page.getByRole('heading', {name: 'The White Lotus'}),
    ).toBeVisible();
    await expect(page.getByText('Watching season 1')).toBeVisible();
    await expect(page.getByText('S1E1')).toBeVisible();

    const watchthroughURL = new URL(page.url());

    // Go back to home, check that the watchthrough is present

    await page.getByRole('link', {name: /watching/i}).click();
    await page.waitForURL((url) => url.pathname === '/app');

    const watchthroughLink = page.locator(
      `a[href="${watchthroughURL.href.slice(watchthroughURL.origin.length)}"]`,
    );
    await expect(watchthroughLink).toBeVisible();
    await expect(watchthroughLink.getByText('S1E1')).toBeVisible();
  });

  test('a user can watch episodes in a watchthrough', async ({page}) => {
    await createAccount(page);

    await navigate(page, {to: `/app/series/${SERIES_HANDLE}`});

    await page.getByRole('button', {name: /watch/i}).first().click();

    await page.waitForURL((url) => url.pathname.startsWith('/app/watching/'));

    await page.getByRole('button', {name: /watch/i}).first().click();

    await expect(page.getByText('S1E2')).toBeVisible();
  });
});
