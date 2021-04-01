/* eslint import/no-extraneous-dependencies: off */

import {Stack, Construct} from '@aws-cdk/core';
import {Function, Runtime, Code} from '@aws-cdk/aws-lambda';
import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {Vpc} from '@aws-cdk/aws-ec2';
import {
  CloudFrontAllowedCachedMethods,
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  // LambdaEdgeEventType,
  OriginProtocolPolicy,
  PriceClass,
  ViewerCertificate,
} from '@aws-cdk/aws-cloudfront';
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

const DOMAIN = 'watch-test.lemon.tools';
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

    graphqlFunction.connections.allowDefaultPortFromAnyIpv4();

    const oauthFunction = new Function(this, 'WatchAppOauthFunction', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: Code.fromInline('module.exports.handler = () => {}'),
      functionName: 'WatchAppOauthFunction',
    });

    const appHttpApi = new HttpApi(this, 'WatchAppHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({handler: appFunction}),
    });

    const graphqlHttpApi = new HttpApi(this, 'WatchGraphQLHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: graphqlFunction,
      }),
    });

    const githubOAuthApi = new HttpApi(this, 'WatchGithubOAuthApi', {
      defaultIntegration: new LambdaProxyIntegration({handler: oauthFunction}),
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

    // const assetsHeaderRewriteFunction = new Function(
    //   this,
    //   'WatchAssetsHeaderRewriteFunction',
    //   {
    //     code: Code.fromInline(
    //       'module.exports.handler = (event, _, callback) => callback(null, event.Records[0].cf.response)',
    //     ),
    //     runtime: Runtime.NODEJS_12_X,
    //     handler: 'index.handler',
    //     functionName: 'WatchAssetsHeaderRewriteFunction',
    //   },
    // );

    // const assetsBrotliPathRewriteFunction = new Function(
    //   this,
    //   'WatchAssetsBrotliPathRewriteFunction',
    //   {
    //     code: Code.fromInline(
    //       'module.exports.handler = (event, _, callback) => callback(null, event.Records[0].cf.request)',
    //     ),
    //     runtime: Runtime.NODEJS_12_X,
    //     handler: 'index.handler',
    //     functionName: 'WatchAssetsBrotliPathRewriteFunction',
    //   },
    // );

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

    const cloudfrontDistribution = new CloudFrontWebDistribution(
      this,
      'WatchCloudFront',
      {
        priceClass: PriceClass.PRICE_CLASS_ALL,
        viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
          aliases: [DOMAIN],
        }),

        originConfigs: [
          {
            s3OriginSource: {s3BucketSource: appAssetsBucket},
            behaviors: [
              {
                pathPattern: '/assets/app*',
                compress: true,
                isDefaultBehavior: false,
                // lambdaFunctionAssociations: [
                //   {
                //     eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                //     lambdaFunction:
                //       assetsBrotliPathRewriteFunction.currentVersion,
                //   },
                //   {
                //     eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
                //     lambdaFunction: assetsHeaderRewriteFunction.currentVersion,
                //   },
                // ],
              },
            ],
          },
          {
            s3OriginSource: {s3BucketSource: clipsAssetsBucket},
            behaviors: [
              {
                pathPattern: '/assets/clips*',
                compress: true,
                isDefaultBehavior: false,
                // lambdaFunctionAssociations: [
                //   {
                //     eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                //     lambdaFunction:
                //       assetsBrotliPathRewriteFunction.currentVersion,
                //   },
                //   {
                //     eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
                //     lambdaFunction: assetsHeaderRewriteFunction.currentVersion,
                //   },
                // ],
              },
            ],
          },
          {
            customOriginSource: {
              domainName: graphqlHttpApi
                .url!.replace(/^https:[/][/]/, '')
                .split('/')[0],
              originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
            },
            behaviors: [
              {
                pathPattern: '/api/graphql*',
                compress: true,
                isDefaultBehavior: false,
                allowedMethods: CloudFrontAllowedMethods.ALL,
                cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                forwardedValues: {
                  queryString: true,
                  cookies: {forward: 'all'},
                },
              },
            ],
          },
          {
            customOriginSource: {
              domainName: githubOAuthApi
                .url!.replace(/^https:[/][/]/, '')
                .split('/')[0],
              originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
            },
            behaviors: [
              {
                pathPattern: '/me/oauth/github*',
                compress: true,
                isDefaultBehavior: false,
                forwardedValues: {
                  queryString: true,
                  cookies: {forward: 'all'},
                },
              },
            ],
          },
          {
            customOriginSource: {
              domainName: appHttpApi
                .url!.replace(/^https:[/][/]/, '')
                .split('/')[0],
              originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
            },
            behaviors: [
              {
                compress: true,
                isDefaultBehavior: true,
                forwardedValues: {
                  queryString: true,
                  cookies: {forward: 'all'},
                },
              },
            ],
          },
        ],
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
