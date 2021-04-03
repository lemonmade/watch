/* eslint import/no-extraneous-dependencies: off */

import {Stack, Construct, Duration} from '@aws-cdk/core';
import {Function, Runtime, Code} from '@aws-cdk/aws-lambda';
import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {Port, Vpc} from '@aws-cdk/aws-ec2';
import {
  PriceClass,
  Distribution,
  CachePolicy,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CacheQueryStringBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  ViewerProtocolPolicy,
  LambdaEdgeEventType,
  AllowedMethods,
  CachedMethods,
} from '@aws-cdk/aws-cloudfront';
import {HttpOrigin, S3Origin} from '@aws-cdk/aws-cloudfront-origins';
import {DnsValidatedCertificate} from '@aws-cdk/aws-certificatemanager';
import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';
import {Bucket, BucketProps} from '@aws-cdk/aws-s3';
import {
  HostedZone,
  ARecord,
  AaaaRecord,
  RecordTarget,
} from '@aws-cdk/aws-route53';
import {CloudFrontTarget} from '@aws-cdk/aws-route53-targets';
import {AnyPrincipal} from '@aws-cdk/aws-iam';
import {Queue} from '@aws-cdk/aws-sqs';
import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';

const DOMAIN = 'watch.lemon.tools';
const DEFAULT_REGION = 'us-east-1';

class PublicBucket extends Bucket {
  constructor(scope: Construct, id: string, props?: BucketProps) {
    super(scope, id, props);
    this.grantRead(new AnyPrincipal());
  }
}

export class WatchAppStack extends Stack {
  constructor(construct: Construct) {
    super(construct, 'WatchTestApp', {
      env: {
        account: '552916950096',
        region: DEFAULT_REGION,
      },
    });

    const appAssetsBucket = new PublicBucket(this, 'WatchAppAssetsBucket', {
      bucketName: 'watch-assets-app',
    });

    const clipsAssetsBucket = new PublicBucket(this, 'WatchClipsAssetsBucket', {
      bucketName: 'watch-assets-clips',
    });

    // new Bucket(this, 'AppImagesBucket', {
    //   bucketName: 'watch-app-images',
    // });

    // new Bucket(this, 'LambdaBucket', {
    //   bucketName: 'watch-lambda',
    // });

    const appFunction = new Function(this, 'WatchAppFunction', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: Code.fromInline('module.exports.handler = () => {}'),
      functionName: 'WatchAppFunction',
    });

    const vpc = Vpc.fromLookup(this, 'WatchDatabaseVpc', {
      vpcId: 'vpc-0e09f839483ce344c',
    });

    const graphqlFunction = new Function(this, 'WatchGraphQLFunction', {
      vpc,
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: Code.fromInline('module.exports.handler = () => {}'),
      functionName: 'WatchGraphQLFunction',
    });

    graphqlFunction.connections.allowFromAnyIpv4(Port.allTraffic());

    const githubOAuthFunction = new Function(this, 'WatchGithubOAuthFunction', {
      vpc,
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: Code.fromInline('module.exports.handler = () => {}'),
      functionName: 'WatchGithubOAuthFunction',
    });

    githubOAuthFunction.connections.allowFromAnyIpv4(Port.allTraffic());

    const appHttpApi = new HttpApi(this, 'WatchAppHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({handler: appFunction}),
    });

    const graphqlHttpApi = new HttpApi(this, 'WatchGraphQLHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: graphqlFunction,
      }),
    });

    const githubOAuthApi = new HttpApi(this, 'WatchGithubOAuthApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: githubOAuthFunction,
      }),
    });

    const tmdbRefresherSchedulerFunction = new Function(
      this,
      'WatchTmdbRefresherSchedulerFunction',
      {
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.handler',
        code: Code.fromInline('module.exports.handler = () => {}'),
        functionName: 'WatchTmdbRefresherSchedulerFunction',
      },
    );

    const tmdbRefresherFunction = new Function(
      this,
      'WatchTmdbRefresherFunction',
      {
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.handler',
        code: Code.fromInline('module.exports.handler = () => {}'),
        functionName: 'WatchTmdbRefresherFunction',
      },
    );

    new Rule(this, 'WatchTmdbRefresherRule', {
      ruleName: 'WatchTmdbRefresherRule',
      schedule: Schedule.cron({hour: '10', minute: '15'}),
      targets: [new LambdaFunction(tmdbRefresherSchedulerFunction)],
    });

    const tmdbRefresherQueue = new Queue(this, 'WatchTmdbRefresherQueue', {
      queueName: 'WatchTmdbRefresherQueue',
      deadLetterQueue: {
        queue: new Queue(this, 'WatchTmdbRefresherDeadLetterQueue', {
          queueName: 'WatchTmdbRefresherDeadLetterQueue',
        }),
        maxReceiveCount: 5,
      },
    });

    tmdbRefresherFunction.addEventSource(
      new SqsEventSource(tmdbRefresherQueue),
    );

    const cloudfrontHeadersCleanupFunction = new Function(
      this,
      'WatchHeadersCleanupFunction',
      {
        code: Code.fromInline(
          'module.exports.handler = (event, _, callback) => callback(null, event.Records[0].cf.response)',
        ),
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.handler',
        functionName: 'WatchHeadersCleanupFunction',
      },
    );

    const cdnPrepareAppRequestFunction = new Function(
      this,
      'WatchCdnPrepareAppRequestFunction',
      {
        code: Code.fromInline(`
          module.exports.handler = (event, _, callback) => {
            console.log(event);
            callback(null, event.Records[0].cf.request);
          }
        `),
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.handler',
        functionName: 'WatchCdnPrepareAppRequestFunction',
      },
    );

    const zone = HostedZone.fromLookup(this, 'WatchDomainZone', {
      domainName: 'lemon.tools',
    });

    const certificate = new DnsValidatedCertificate(
      this,
      'WatchDomainCertificate',
      {
        domainName: DOMAIN,
        hostedZone: zone,
      },
    );

    const cloudfrontDistribution = new Distribution(
      this,
      'WatchCloudFrontDistribution',
      {
        priceClass: PriceClass.PRICE_CLASS_ALL,
        certificate,
        domainNames: [DOMAIN],
        defaultBehavior: {
          origin: new HttpOrigin(
            appHttpApi.url!.replace(/^https:[/][/]/, '').split('/')[0],
          ),
          compress: true,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new CachePolicy(this, 'WatchAppCachePolicy', {
            defaultTtl: Duration.seconds(0),
            cookieBehavior: CacheCookieBehavior.none(),
            headerBehavior: CacheHeaderBehavior.none(),
            queryStringBehavior: CacheQueryStringBehavior.none(),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
          originRequestPolicy: new OriginRequestPolicy(
            this,
            'WatchAppOriginRequestPolicy',
            {
              cookieBehavior: OriginRequestCookieBehavior.all(),
              headerBehavior: OriginRequestHeaderBehavior.allowList(
                'User-Agent',
                'X-Forwarded-Host',
              ),
              queryStringBehavior: OriginRequestQueryStringBehavior.all(),
            },
          ),
          edgeLambdas: [
            {
              eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
              functionVersion: cloudfrontHeadersCleanupFunction.currentVersion,
            },
            {
              eventType: LambdaEdgeEventType.VIEWER_REQUEST,
              functionVersion: cdnPrepareAppRequestFunction.currentVersion,
            },
          ],
        },
        additionalBehaviors: {
          '/assets/app*': {
            origin: new S3Origin(appAssetsBucket),
            compress: true,
            viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
            cachePolicy: new CachePolicy(this, 'WatchAppAssetsCachePolicy', {
              cookieBehavior: CacheCookieBehavior.none(),
              headerBehavior: CacheHeaderBehavior.none(),
              queryStringBehavior: CacheQueryStringBehavior.none(),
              enableAcceptEncodingGzip: true,
              enableAcceptEncodingBrotli: true,
            }),
            originRequestPolicy: new OriginRequestPolicy(
              this,
              'WatchAppAssetsOriginRequestPolicy',
              {
                cookieBehavior: OriginRequestCookieBehavior.none(),
                headerBehavior: OriginRequestHeaderBehavior.none(),
                queryStringBehavior: OriginRequestQueryStringBehavior.none(),
              },
            ),
            edgeLambdas: [
              {
                eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
                functionVersion:
                  cloudfrontHeadersCleanupFunction.currentVersion,
              },
            ],
          },
          '/assets/clips*': {
            origin: new S3Origin(clipsAssetsBucket),
            compress: true,
            viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
            cachePolicy: new CachePolicy(this, 'WatchClipsAssetsCachePolicy', {
              cookieBehavior: CacheCookieBehavior.none(),
              headerBehavior: CacheHeaderBehavior.none(),
              queryStringBehavior: CacheQueryStringBehavior.none(),
              enableAcceptEncodingGzip: true,
              enableAcceptEncodingBrotli: true,
            }),
            originRequestPolicy: new OriginRequestPolicy(
              this,
              'WatchClipsAssetsOriginRequestPolicy',
              {
                cookieBehavior: OriginRequestCookieBehavior.none(),
                headerBehavior: OriginRequestHeaderBehavior.none(),
                queryStringBehavior: OriginRequestQueryStringBehavior.none(),
              },
            ),
            edgeLambdas: [
              {
                eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
                functionVersion:
                  cloudfrontHeadersCleanupFunction.currentVersion,
              },
            ],
          },
          '/api/graphql*': {
            origin: new HttpOrigin(
              graphqlHttpApi.url!.replace(/^https:[/][/]/, '').split('/')[0],
            ),
            compress: true,
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
            viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
            cachePolicy: new CachePolicy(this, 'WatchGraphQLApiCachePolicy', {
              defaultTtl: Duration.seconds(0),
              cookieBehavior: CacheCookieBehavior.none(),
              headerBehavior: CacheHeaderBehavior.none(),
              queryStringBehavior: CacheQueryStringBehavior.none(),
              enableAcceptEncodingGzip: true,
              enableAcceptEncodingBrotli: true,
            }),
            originRequestPolicy: new OriginRequestPolicy(
              this,
              'WatchGraphQLApiOriginRequestPolicy',
              {
                cookieBehavior: OriginRequestCookieBehavior.all(),
                headerBehavior: OriginRequestHeaderBehavior.allowList(
                  'X-Debug',
                  'X-Forwarded-Host',
                ),
                queryStringBehavior: OriginRequestQueryStringBehavior.none(),
              },
            ),
            edgeLambdas: [
              {
                eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
                functionVersion:
                  cloudfrontHeadersCleanupFunction.currentVersion,
              },
              {
                eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                functionVersion: cdnPrepareAppRequestFunction.currentVersion,
              },
            ],
          },
          '/internal/auth/github*': {
            origin: new HttpOrigin(
              githubOAuthApi.url!.replace(/^https:[/][/]/, '').split('/')[0],
            ),
            compress: true,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: new CachePolicy(this, 'WatchGithubOAuthCachePolicy', {
              defaultTtl: Duration.seconds(0),
              cookieBehavior: CacheCookieBehavior.none(),
              headerBehavior: CacheHeaderBehavior.none(),
              queryStringBehavior: CacheQueryStringBehavior.none(),
              enableAcceptEncodingGzip: true,
              enableAcceptEncodingBrotli: true,
            }),
            originRequestPolicy: new OriginRequestPolicy(
              this,
              'WatchGithubOAuthOriginRequestPolicy',
              {
                cookieBehavior: OriginRequestCookieBehavior.all(),
                headerBehavior: OriginRequestHeaderBehavior.allowList(
                  'X-Forwarded-Host',
                ),
                queryStringBehavior: OriginRequestQueryStringBehavior.all(),
              },
            ),
            edgeLambdas: [
              {
                eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
                functionVersion:
                  cloudfrontHeadersCleanupFunction.currentVersion,
              },
              {
                eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                functionVersion: cdnPrepareAppRequestFunction.currentVersion,
              },
            ],
          },
        },
      },
    );

    const domainRecordTarget = RecordTarget.fromAlias(
      new CloudFrontTarget(cloudfrontDistribution),
    );

    new ARecord(this, 'WatchCloudFrontARecord', {
      zone,
      target: domainRecordTarget,
      recordName: DOMAIN,
    });

    new AaaaRecord(this, 'WatchCloudFrontAaaaRecord', {
      zone,
      target: domainRecordTarget,
      recordName: DOMAIN,
    });
  }
}
