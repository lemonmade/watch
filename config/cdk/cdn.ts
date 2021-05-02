import {Duration} from '@aws-cdk/core';
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
import {
  HostedZone,
  ARecord,
  AaaaRecord,
  RecordTarget,
} from '@aws-cdk/aws-route53';
import {CloudFrontTarget} from '@aws-cdk/aws-route53-targets';

import {Stack, Construct} from '../../global/utilities/infrastructure';

import type {GlobalInfrastructureStack} from '../../global/infrastructure';
import type {AppStack} from '../../app/infrastructure';
import type {GraphQLApiStack} from '../../functions/api/infrastructure';
import type {AuthApiStack} from '../../functions/auth/infrastructure';
import type {CdnRequestForwardHostStack} from '../../functions/cdn-request-forward-host/infrastructure';
import type {CdnResponseHeaderCleanupStack} from '../../functions/cdn-response-header-cleanup/infrastructure';

const DOMAIN = 'watch.lemon.tools';

export class CdnStack extends Stack {
  constructor(
    construct: Construct,
    {
      app,
      auth,
      global,
      graphqlApi,
      cdnRequestForwardHost,
      cdnResponseHeaderCleanup,
    }: {
      app: AppStack;
      auth: AuthApiStack;
      global: GlobalInfrastructureStack;
      graphqlApi: GraphQLApiStack;
      cdnRequestForwardHost: CdnRequestForwardHostStack;
      cdnResponseHeaderCleanup: CdnResponseHeaderCleanupStack;
    },
  ) {
    super(construct, 'WatchCdnStack', {
      dependencies: [
        global,
        app,
        auth,
        graphqlApi,
        cdnRequestForwardHost,
        cdnResponseHeaderCleanup,
      ],
    });

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
            app.endpoint.replace(/^https:[/][/]/, '').split('/')[0],
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
              eventType: LambdaEdgeEventType.VIEWER_REQUEST,
              functionVersion: cdnRequestForwardHost.function.currentVersion,
            },
            {
              eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
              functionVersion: cdnResponseHeaderCleanup.function.currentVersion,
            },
          ],
        },
        additionalBehaviors: {
          '/assets/app*': {
            origin: new S3Origin(global.appAssetsBucket),
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
                  cdnResponseHeaderCleanup.function.currentVersion,
              },
            ],
          },
          '/assets/clips*': {
            origin: new S3Origin(global.clipsAssetsBucket),
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
                  cdnResponseHeaderCleanup.function.currentVersion,
              },
            ],
          },
          '/api/graphql*': {
            origin: new HttpOrigin(
              graphqlApi.endpoint.replace(/^https:[/][/]/, '').split('/')[0],
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
                eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                functionVersion: cdnRequestForwardHost.function.currentVersion,
              },
              {
                eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
                functionVersion:
                  cdnResponseHeaderCleanup.function.currentVersion,
              },
            ],
          },
          '/internal/auth*': {
            origin: new HttpOrigin(
              auth.endpoint.replace(/^https:[/][/]/, '').split('/')[0],
            ),
            compress: true,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: new CachePolicy(this, 'WatchAuthCachePolicy', {
              defaultTtl: Duration.seconds(0),
              cookieBehavior: CacheCookieBehavior.none(),
              headerBehavior: CacheHeaderBehavior.none(),
              queryStringBehavior: CacheQueryStringBehavior.none(),
              enableAcceptEncodingGzip: true,
              enableAcceptEncodingBrotli: true,
            }),
            originRequestPolicy: new OriginRequestPolicy(
              this,
              'WatchAuthOriginRequestPolicy',
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
                eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                functionVersion: cdnRequestForwardHost.function.currentVersion,
              },
              {
                eventType: LambdaEdgeEventType.VIEWER_RESPONSE,
                functionVersion:
                  cdnResponseHeaderCleanup.function.currentVersion,
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
