import {App, Duration} from '@aws-cdk/core';
import {Vpc} from '@aws-cdk/aws-ec2';
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

import {
  Database,
  Stack,
  Secret,
  Construct,
} from '../../../global/utilities/infrastructure';

import {WebApp} from '../../../app/infrastructure';
import {GraphQLApi} from '../../../functions/api/infrastructure';
import {AuthApi} from '../../../functions/auth/infrastructure';
import {Email} from '../../../functions/email/infrastructure';
import {TmdbRefresherScheduler} from '../../../functions/tmdb-refresher-scheduler/infrastructure';
import {TmdbRefresher} from '../../../functions/tmdb-refresher/infrastructure';
import {CdnRequestForwardHost} from '../../../functions/cdn-request-forward-host/infrastructure';
import {CdnResponseHeaderCleanup} from '../../../functions/cdn-response-header-cleanup/infrastructure';

const DOMAIN = 'watch.lemon.tools';

export class WatchStack extends Stack {
  constructor(app: App) {
    super(app, 'WatchStack');

    const database = new Database(this, {
      vpc: new Vpc(this, 'WatchVpc'),
      name: 'PrimaryDatabase',
      databaseName: 'watch',
    });

    const jwt = new Secret(this, 'WatchDefaultJWTSecret', {
      secretName: 'Watch/DefaultJWT',
    });

    const github = new Secret(this, 'WatchGithubOAuthClientSecret', {
      secretName: 'Watch/Github/OAuthCredentials',
    });

    const tmdb = new Secret(this, 'WatchTmdbApiCredentialsSecret', {
      secretName: 'Watch/Tmdb/ApiCredentials',
    });

    const webApp = new WebApp(this);
    const email = new Email(this, {database});
    const graphqlApi = new GraphQLApi(this, {jwt, tmdb, database, email});
    const authApi = new AuthApi(this, {jwt, github, database});

    const refresher = new TmdbRefresher(this, {
      tmdb,
      database,
    });
    new TmdbRefresherScheduler(this, {
      database,
      refresher,
    });

    const cdnRequestForwardHost = new CdnRequestForwardHost(this);
    const cdnResponseHeaderCleanup = new CdnResponseHeaderCleanup(this);

    new Cdn(this, {
      webApp,
      authApi,
      graphqlApi,
      cdnRequestForwardHost,
      cdnResponseHeaderCleanup,
    });
  }
}

export class Cdn extends Construct {
  constructor(
    construct: Construct,
    {
      webApp,
      authApi,
      graphqlApi,
      cdnRequestForwardHost,
      cdnResponseHeaderCleanup,
    }: {
      webApp: WebApp;
      authApi: AuthApi;
      graphqlApi: GraphQLApi;
      cdnRequestForwardHost: CdnRequestForwardHost;
      cdnResponseHeaderCleanup: CdnResponseHeaderCleanup;
    },
  ) {
    super(construct, 'WatchCdnStack');

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
            webApp.endpoint.replace(/^https:[/][/]/, '').split('/')[0]!,
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
            origin: new S3Origin(webApp.assetsBucket),
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
            origin: new S3Origin(graphqlApi.clipsBucket),
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
              graphqlApi.endpoint.replace(/^https:[/][/]/, '').split('/')[0]!,
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
                  // For API client bearer authentication
                  'X-Access-Token',
                  // To get the original host
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
              authApi.endpoint.replace(/^https:[/][/]/, '').split('/')[0]!,
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
                headerBehavior:
                  OriginRequestHeaderBehavior.allowList('X-Forwarded-Host'),
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
