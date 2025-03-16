import type {Page} from '@playwright/test';

import {E2E_TEST_ACCOUNT_EMAIL_SUFFIX} from '../../../global/e2e.ts';

import {navigate} from './navigate.ts';

export async function createAccount(page: Page) {
  const email = `test-user-${Math.random().toString(36).substring(2, 15)}${E2E_TEST_ACCOUNT_EMAIL_SUFFIX}`;

  await navigate(page, {to: '/'});
  await page.getByRole('link', {name: /create account/i}).click();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', {name: /create account with email/i}).click();

  await page.waitForURL((url) => url.pathname === '/app');

  return {email};
}

export async function signIn(page: Page, email: string) {
  await navigate(page, {to: '/'});
  await page.getByRole('link', {name: /sign in/i}).click();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', {name: /sign in with email/i}).click();
}
