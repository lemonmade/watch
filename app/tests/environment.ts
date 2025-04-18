import type {Environment} from '~/shared/environment.ts';

export class TestEnvironment implements Environment {
  readonly isPreview: boolean = false;
  readonly debug = {
    flags: {logLevel: 'verbose'},
  } satisfies Environment['debug'];
}
