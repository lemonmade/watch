import type {Page} from '@playwright/test';

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

    const token = sign({git: {sha: process.env.GITHUB_SHA}}, 'SECRET');

    await this.page.setExtraHTTPHeaders({
      'Watch-E2E-Test': token,
    });
  }
}
