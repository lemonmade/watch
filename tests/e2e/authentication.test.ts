import {test, expect, type Page} from '@playwright/test';

import {E2E_TEST_ACCOUNT_EMAIL_SUFFIX} from '../../global/e2e.ts';

import {AppURL, AppTestRunner} from './shared/runner.ts';

test.describe('authentication', () => {
  test('an unauthenticated user is redirected to sign in', async ({page}) => {
    const targetURL = new AppURL('/app');
    const expectedURL = new AppURL('/sign-in');
    expectedURL.searchParams.set('redirect', targetURL.href);

    const runner = new AuthenticationTestRunner(page);

    await runner.goto(targetURL);

    await expect(page).toHaveURL(expectedURL.href);
  });

  test('a user can create an account', async ({page}) => {
    const runner = new AuthenticationTestRunner(page);

    const {email} = await runner.createAccount();

    await page.getByRole('link', {name: /me/i}).click();

    await expect(page.getByText(`Email: ${email}`)).toBeVisible();
  });
});

class AuthenticationTestRunner extends AppTestRunner {
  constructor(page: Page) {
    super(page);
  }

  async createAccount() {
    const email = `test-user-${Math.random().toString(36).substring(2, 15)}${E2E_TEST_ACCOUNT_EMAIL_SUFFIX}`;

    await this.goto('/');
    await this.page.getByRole('link', {name: /create account/i}).click();
    await this.page.getByLabel('Email').fill(email);
    await this.page
      .getByRole('button', {name: /create account with email/i})
      .click();

    return {email};
  }

  async signIn(email: string) {
    await this.goto('/');
    await this.page.getByRole('link', {name: /sign in/i}).click();
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByRole('button', {name: /sign in with email/i}).click();
  }
}
