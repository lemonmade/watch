import type {Page} from '@playwright/test';

import {E2E_TEST_CONTEXT_HEADER} from '../../../global/e2e.ts';
import {PREVIEW_HEADER} from '../../../global/preview.ts';

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

export async function navigate(page: Page, {to}: {to: AppRoute | URL}) {
  await applyCustomHeaders(page);
  const url = typeof to === 'string' ? new AppURL(to) : to;
  await page.goto(url.href);
}

const APPLIED_CUSTOM_HEADERS = new WeakSet<Page>();

async function applyCustomHeaders(page: Page) {
  if (APPLIED_CUSTOM_HEADERS.has(page)) {
    return;
  }

  const {default: jwt} = await import('@tsndr/cloudflare-worker-jwt');

  const token = await jwt.sign(
    {git: {sha: process.env.GITHUB_SHA}, exp: Date.now() + 10 * 60 * 1_000},
    process.env.JWT_E2E_TEST_HEADER_SECRET!,
  );

  const extraHeaders: Record<string, string> = {
    [E2E_TEST_CONTEXT_HEADER]: token,
  };

  if (process.env.PREVIEW_COMMIT) {
    extraHeaders[PREVIEW_HEADER] = process.env.PREVIEW_COMMIT;
  }

  await page.setExtraHTTPHeaders(extraHeaders);

  APPLIED_CUSTOM_HEADERS.add(page);
}
