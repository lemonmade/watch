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
    const url = typeof path === 'string' ? new AppURL(path) : path;
    await this.page.goto(url.href);
  }
}
