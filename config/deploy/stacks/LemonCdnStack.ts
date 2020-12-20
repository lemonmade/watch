/* eslint import/no-extraneous-dependencies: off */

import {stripIndent} from 'common-tags';
import {Stack, Construct} from '@aws-cdk/core';
import {Function, Runtime, Code} from '@aws-cdk/aws-lambda';
import {
  CloudFrontWebDistribution,
  LambdaEdgeEventType,
  PriceClass,
} from '@aws-cdk/aws-cloudfront';
import {Bucket} from '@aws-cdk/aws-s3';
import {AnyPrincipal} from '@aws-cdk/aws-iam';

import {CDN_BUCKET, CDN_DOMAIN, DEFAULT_REGION} from '../constants';

export class LemonCdnStack extends Stack {
  constructor(construct: Construct) {
    super(construct, 'LemonCdn', {
      env: {
        account: '552916950096',
        region: DEFAULT_REGION,
      },
    });

    const cdnBucket = new Bucket(this, 'LemonCdnBucket', {
      bucketName: CDN_BUCKET,
    });

    // Everyone can read from this bucket
    cdnBucket.grantRead(new AnyPrincipal());

    const cdnHeadersHandler = new Function(this, 'LemonCdnTriggerHeaders', {
      code: Code.fromInline(stripIndent`
        module.exports.handler = (event, context, callback) => {
          const {response} = event.Records[0].cf;
          const {headers} = response;
          const originalHeader = 'x-amz-meta-timing-allow-origin';

          if (headers[originalHeader]) {
            const newHeaders = {...headers};

            newHeaders['timing-allow-origin'] = headers[originalHeader].map((entry) => {
              return {
                ...entry,
                key: 'Timing-Allow-Origin',
              };
            });

            delete newHeaders[originalHeader];

            callback(null, {...response, headers: newHeaders});
            return;
          }

          callback(null, response);
        }
      `),
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      functionName: 'LemonCdnTriggerHeaders',
    });

    const cdnBrotliHandler = new Function(this, 'LemonCdnTriggerBrotli', {
      code: Code.fromInline(stripIndent`
        const EXTENSIONS_SUPPORTING_BROTLI = new Set(['css', 'js']);

        module.exports.handler = (event, context, callback) => {
          const request = event.Records[0].cf.request;
          const headers = request.headers;
          
          let normalizedUri = request.uri;

          if (supportsBrotli(request.uri) && headers['accept-encoding']) {
            for (const header of headers['accept-encoding']) {
              if (header.value.includes('br')) {
                normalizedUri = \`$\{normalizedUri\}.br\`;
                break;
              }
            }
          }

          callback(null, {...request, uri: normalizedUri});
        }

        function supportsBrotli(uri) {
          const extension = uri.split('.').pop();
          return EXTENSIONS_SUPPORTING_BROTLI.has(extension);
        }
      `),
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      functionName: 'LemonCdnTriggerBrotli',
    });

    new CloudFrontWebDistribution(this, 'LemonCdnDistribution', {
      priceClass: PriceClass.PRICE_CLASS_ALL,
      aliasConfiguration: {
        names: [CDN_DOMAIN],
        acmCertRef:
          'arn:aws:acm:us-east-1:552916950096:certificate/769a4436-a5be-47ff-81a2-d519ce7e8bae',
      },
      originConfigs: [
        {
          s3OriginSource: {s3BucketSource: cdnBucket},
          behaviors: [
            {
              compress: true,
              isDefaultBehavior: true,
              lambdaFunctionAssociations: [
                {
                  eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                  lambdaFunction: cdnBrotliHandler.currentVersion,
                },
                {
                  eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
                  lambdaFunction: cdnHeadersHandler.currentVersion,
                },
              ],
            },
          ],
        },
      ],
    });
  }
}
