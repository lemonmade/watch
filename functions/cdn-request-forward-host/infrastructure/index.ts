import {
  Stack,
  Construct,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

export class CdnRequestForwardHostStack extends Stack {
  readonly function: QuiltServiceLambda;

  constructor(parent: Construct) {
    super(parent, 'WatchCdnRequestForwardHostStack');

    this.function = new QuiltServiceLambda(
      this,
      'WatchCdnRequestForwardHostFunction',
      {
        name: 'cdn-request-forward-host',
        functionName: 'WatchCdnRequestForwardHostFunction',
      },
    );
  }
}
