import type {Page} from '@playwright/test';

import {E2E_TEST_CONTEXT_HEADER} from '../../../global/e2e.ts';

export type AppRoute = '/' | '/app' | '/sign-in';

export class AppURL extends URL {
  constructor(path: AppRoute = '/') {
    super(path, 'https://watch.lemon.tools/');
  }
}

export class AppTestRunner {
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
    const {sign} = await import('jsonwebtoken');

    const token = sign(
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
