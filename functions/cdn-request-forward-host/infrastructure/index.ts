import {
  Duration,
  Construct,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

export class CdnRequestForwardHost extends Construct {
  readonly function: QuiltServiceLambda;

  constructor(parent: Construct) {
    super(parent, 'WatchCdnRequestForwardHost');

    this.function = new QuiltServiceLambda(
      this,
      'WatchCdnRequestForwardHostFunction',
      {
        name: 'cdn-request-forward-host',
        functionName: 'WatchCdnRequestForwardHostFunction',
        timeout: Duration.seconds(1),
      },
    );
  }
}
