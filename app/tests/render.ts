import {expect} from 'vitest';
import {matchers, type CustomMatchers} from '@quilted/preact-testing/matchers';

export {TestRouter} from '@quilted/quilt/navigation/testing';

export * from './render/types.ts';
export {renderApp} from './render/render.tsx';

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend(matchers);
