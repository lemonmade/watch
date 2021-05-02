import {
  Stack,
  Construct,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

export class CdnResponseHeaderCleanupStack extends Stack {
  readonly function: QuiltServiceLambda;

  constructor(parent: Construct) {
    super(parent, 'WatchCdnResponseHeaderCleanupStack');

    this.function = new QuiltServiceLambda(
      this,
      'WatchCdnResponseHeaderCleanupFunction',
      {
        name: 'cdn-response-header-cleanup',
        functionName: 'WatchCdnResponseHeaderCleanupFunction',
      },
    );
  }
}
