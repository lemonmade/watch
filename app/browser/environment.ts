import type {Browser} from '@quilted/quilt/browser';
import type {Environment} from '~/shared/environment.ts';

export interface SerializedEnvironmentFromServer
  extends Pick<Environment, 'preview' | 'debug'> {}

export class EnvironmentForBrowser implements Environment {
  readonly isPreview: boolean;
  readonly preview: Environment['preview'];
  readonly debug: Environment['debug'];

  constructor(browser: Browser) {
    const serialized =
      browser.serializations.get<SerializedEnvironmentFromServer>(
        'app.environment',
      );

    this.isPreview = serialized.preview != null;
    this.preview = serialized.preview;
    this.debug = serialized.debug;
  }
}
