import * as path from 'path';
import {
  Stack as BaseStack,
  Construct,
  Duration,
  RemovalPolicy,
  StackProps,
} from '@aws-cdk/core';
import {Function, Runtime, FunctionProps, Code} from '@aws-cdk/aws-lambda';
import {Secret, ISecret} from '@aws-cdk/aws-secretsmanager';
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  Vpc,
} from '@aws-cdk/aws-ec2';
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
} from '@aws-cdk/aws-rds';
import {Bucket, BucketProps} from '@aws-cdk/aws-s3';
import {AnyPrincipal, IGrantable} from '@aws-cdk/aws-iam';

const DEFAULT_REGION = 'us-east-1';

const DEFAULT_ENVIRONMENT = {
  account: '552916950096',
  region: DEFAULT_REGION,
};

const DATABASE_PORT = 5432;

const root = path.resolve(__dirname, '../..');

export {Construct};

export type {IGrantable as Grantable};

export class Stack extends BaseStack {
  constructor(
    scope?: Construct,
    id?: string,
    {
      dependencies = [],
      ...props
    }: StackProps & {dependencies?: BaseStack[]} = {},
  ) {
    super(scope, id, {...props, env: {...DEFAULT_ENVIRONMENT, ...props?.env}});

    for (const dependency of dependencies) {
      this.addDependency(dependency);
    }
  }
}

export class PublicBucket extends Bucket {
  constructor(scope: Construct, id: string, props?: BucketProps) {
    super(scope, id, {removalPolicy: RemovalPolicy.DESTROY, ...props});
    this.grantRead(new AnyPrincipal());
  }
}

export class NodeLambda extends Function {
  constructor(
    scope: Construct,
    id: string,
    {
      public: isPublic = false,
      ...props
    }: Omit<FunctionProps, 'runtime' | 'handler'> & {public?: boolean},
  ) {
    super(scope, id, {
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      ...props,
    });

    if (isPublic && props.vpc) {
      // Lets the public internet connect to the function
      this.connections.allowFromAnyIpv4(Port.allTraffic());
    }
  }
}

export class QuiltServiceLambda extends NodeLambda {
  constructor(
    scope: Construct,
    id: string,
    {
      name,
      ...props
    }: Omit<FunctionProps, 'code' | 'runtime' | 'handler'> & {
      name: string;
      public?: boolean;
    },
  ) {
    super(scope, id, {
      code: Code.fromAsset(buildPath('services', name)),
      ...props,
    });
  }
}

export class Database extends Construct {
  private readonly instance: DatabaseInstance;
  private readonly credentialsSecret: ISecret;

  get vpc() {
    return this.instance.vpc;
  }

  get environmentVariables() {
    return {
      DATABASE_PORT: String(DATABASE_PORT),
      DATABASE_HOST: this.instance.dbInstanceEndpointAddress,
      DATABASE_CREDENTIALS_SECRET: this.credentialsSecret.secretName,
    };
  }

  constructor(
    construct: Construct,
    {
      vpc,
      name,
      databaseName,
    }: {name: `${string}Database`; databaseName: string; vpc: Vpc},
  ) {
    super(construct, `Watch${name}`);

    this.credentialsSecret = Secret.fromSecretNameV2(
      this,
      `Watch${name}CredentialsSecret`,
      `Watch/${name}/Credentials`,
    );

    this.instance = new DatabaseInstance(this, `Watch${name}Instance`, {
      databaseName,
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_13,
      }),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE3,
        InstanceSize.SMALL,
      ),
      credentials: Credentials.fromSecret(this.credentialsSecret),
      vpc,
      port: DATABASE_PORT,
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(3),
    });

    // Per https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html#rds-proxy.limits,
    // only RDS >11.5 <12 supports the proxy.
    // Per https://www.prisma.io/docs/guides/deployment/deployment-guides/caveats-when-deploying-to-aws-platforms#aws-lambda-upload-limit,
    // the way prisma queries makes the proxy ineffective anyways :(
    //
    // const primaryDatabaseProxy = this.instance.addProxy(
    //   'WatchDatabaseProxy',
    //   {
    //     vpc,
    //     dbProxyName: `${databaseName}Proxy`,
    //     secrets: [this.credentialsSecret],
    //   },
    // );
  }

  grantAccess(grantable: IGrantable) {
    this.instance.grantConnect(grantable);
    this.credentialsSecret.grantRead(grantable);
  }
}

export function buildPath(...parts: string[]) {
  return path.resolve(root, 'build', ...parts);
}