import type {Page} from '@playwright/test';

import {E2E_TEST_CONTEXT_HEADER} from '../../../global/e2e.ts';

export type AppRoute =
  | '/'
  | '/app'
  | '/app/me'
  | `/app/series/${string}`
  | '/sign-in'
  | '/create-account';

export class AppURL extends URL {
  constructor(path: AppRoute = '/') {
    super(path, 'https://watch.lemon.tools/');
  }
}

export async function navigate(page: Page, to: AppRoute | URL = '/') {
  const {default: jwt} = await import('jsonwebtoken');

  const token = jwt.sign(
    {git: {sha: process.env.GITHUB_SHA}},
    process.env.JWT_E2E_TEST_HEADER_SECRET!,
    {
      expiresIn: '10 minutes',
    },
  );

  await page.setExtraHTTPHeaders({
    [E2E_TEST_CONTEXT_HEADER]: token,
  });

  const url = typeof to === 'string' ? new AppURL(to) : to;
  await page.goto(url.href);
}

export class AppTestHelper {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: AppRoute | URL = '/') {
    await this.#setE2ETestHeader();
    const url = typeof path === 'string' ? new AppURL(path) : path;
    await this.page.goto(url.href);
  }

  async #setE2ETestHeader() {
    const {default: jwt} = await import('jsonwebtoken');

    const token = jwt.sign(
      {git: {sha: process.env.GITHUB_SHA}},
      process.env.JWT_E2E_TEST_HEADER_SECRET!,
      {
        expiresIn: '10 minutes',
      },
    );

    await this.page.setExtraHTTPHeaders({
      [E2E_TEST_CONTEXT_HEADER]: token,
    });
  }
}
