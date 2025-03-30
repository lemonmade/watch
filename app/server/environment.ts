import {PREVIEW_HEADER} from '~/global/preview.ts';
import type {Environment} from '~/shared/environment.ts';

export const DEBUG_HEADER = 'Watch-Internal-Debug';
const ALLOWED_LOG_LEVELS = new Set<Environment['debug']['flags']['logLevel']>([
  'verbose',
  'auto',
]);

export class EnvironmentForRequest implements Environment {
  readonly preview: Environment['preview'];
  readonly isPreview: Environment['isPreview'];
  readonly debug: Environment['debug'];
  readonly #request: Request;

  constructor(request: Request) {
    this.#request = request;

    const previewHeader = this.#request.headers.get(PREVIEW_HEADER);
    if (previewHeader) {
      this.preview = {commit: previewHeader};
      this.isPreview = true;
    } else {
      this.isPreview = false;
    }

    const debugHeader = this.#request.headers.get(DEBUG_HEADER);
    let parsedDebugHeader;

    try {
      parsedDebugHeader = JSON.parse(debugHeader ?? '{}');
    } catch {}

    this.debug = {
      flags: {
        logLevel: ALLOWED_LOG_LEVELS.has(parsedDebugHeader?.logLevel)
          ? parsedDebugHeader.logLevel
          : 'auto',
      },
    };
  }
}
