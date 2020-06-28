import * as path from 'path';

import {Stack, Duration, Construct} from '@aws-cdk/core';
// import {Bucket} from '@aws-cdk/aws-s3';
// import {
//   Source,
//   CacheControl,
//   BucketDeployment,
// } from '@aws-cdk/aws-s3-deployment';
import {Function, Runtime, Code} from '@aws-cdk/aws-lambda';
import {Role, ServicePrincipal, ManagedPolicy} from '@aws-cdk/aws-iam';
import {
  HttpApi,
  LambdaProxyIntegration,
  HttpMethod,
} from '@aws-cdk/aws-apigatewayv2';
// import {CloudFrontWebDistribution} from '@aws-cdk/aws-cloudfront';
import {Vpc, InstanceType, InstanceClass, InstanceSize} from '@aws-cdk/aws-ec2';
import {DatabaseInstance, DatabaseInstanceEngine} from '@aws-cdk/aws-rds';

export class WatchStack extends Stack {
  constructor(construct: Construct) {
    super(construct, 'WatchStack');

    const apiVpc = new Vpc(this, 'TestingWatchApiVpc', {
      enableDnsSupport: true,
      enableDnsHostnames: true,
    });

    new DatabaseInstance(this, 'TestingWatchDb', {
      engine: DatabaseInstanceEngine.POSTGRES,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      vpc: apiVpc,
      masterUsername: 'postgres',
      port: 5432,
    });

    const apiLambdaRole = new Role(this, 'TestingWatchApiRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    apiLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );

    apiLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaVPCAccessExecutionRole',
      ),
    );

    const apiLambda = new Function(this, 'TestingWatchApi', {
      code: Code.fromInline('module.exports.handler = () => {}'),
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      role: apiLambdaRole,
      vpc: apiVpc,
    });

    const apiGateway = new HttpApi(this, 'TestingApi', {
      corsPreflight: {
        allowMethods: [HttpMethod.GET, HttpMethod.POST],
        allowOrigins: ['*'],
      },
    });

    apiGateway.addRoutes({
      path: '/',
      integration: new LambdaProxyIntegration({
        handler: apiLambda,
      }),
      methods: [HttpMethod.GET, HttpMethod.POST],
    });

    // const bucket = Bucket.fromBucketName(this, 'WatchCDN', 'cdn.lemon.tools');

    // new BucketDeployment(this, 'DeployCDNAssets', {
    //   sources: [],
    //   destinationBucket: bucket,
    //   cacheControl: [
    //     CacheControl.setPublic(),
    //     CacheControl.maxAge(Duration.days(365)),
    //     {value: 'immutable'},
    //   ],
    // });
  }
}
