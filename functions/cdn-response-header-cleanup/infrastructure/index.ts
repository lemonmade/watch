import {Duration} from '@aws-cdk/core';
import {
  Construct,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

export class CdnResponseHeaderCleanup extends Construct {
  readonly function: QuiltServiceLambda;

  constructor(parent: Construct) {
    super(parent, 'WatchCdnResponseHeaderCleanup');

    this.function = new QuiltServiceLambda(
      this,
      'WatchCdnResponseHeaderCleanupFunction',
      {
        name: 'cdn-response-header-cleanup',
        functionName: 'WatchCdnResponseHeaderCleanupFunction',
        timeout: Duration.seconds(1),
      },
    );
  }
}
