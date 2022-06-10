import * as path from 'path';
import {
  Stack as BaseStack,
  Construct,
  Duration,
  RemovalPolicy,
  StackProps,
  SecretValue,
} from '@aws-cdk/core';
import {
  Function,
  Runtime,
  FunctionProps,
  Code,
  LayerVersion,
  LayerVersionProps,
} from '@aws-cdk/aws-lambda';
import {
  ISecret,
  Secret as SecretManagerSecret,
} from '@aws-cdk/aws-secretsmanager';
import {IConnectable, Port} from '@aws-cdk/aws-ec2';
import {Bucket, BucketProps} from '@aws-cdk/aws-s3';
import {AnyPrincipal, IGrantable} from '@aws-cdk/aws-iam';

export {Duration};

const DEFAULT_REGION = 'us-east-1';

const DEFAULT_ENVIRONMENT = {
  account: '552916950096',
  region: DEFAULT_REGION,
};

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
      timeout: Duration.seconds(10),
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
      code: Code.fromAsset(path.join(root, 'functions', name, 'build/runtime')),
      ...props,
    });
  }
}

export class QuiltLayer extends LayerVersion {
  constructor(
    scope: Construct,
    id: string,
    {
      name,
      ...props
    }: Omit<LayerVersionProps, 'code'> & {
      name: string;
    },
  ) {
    super(scope, id, {
      code: Code.fromAsset(buildPath('lambda/layers', name)),
      ...props,
    });
  }
}

export class PrismaLayer extends QuiltLayer {
  constructor(
    scope: Construct,
    id: string,
    {
      action,
      ...props
    }: Omit<LayerVersionProps, 'code'> & {
      action: 'migrate' | 'query';
    },
  ) {
    super(scope, id, {
      name: `prisma-${action}`,
      ...props,
    });
  }
}

export class Secret extends Construct {
  readonly secret: ISecret;

  get secretName() {
    return this.secret.secretName;
  }

  constructor(
    construct: Construct,
    id: string,
    {secretName}: {secretName: string},
  ) {
    super(construct, id);

    this.secret = SecretManagerSecret.fromSecretNameV2(
      this,
      `${id}SecretFromName`,
      secretName,
    );
  }

  asEnvironmentVariable({key}: {key: string}) {
    return SecretValue.secretsManager(this.secret.secretArn, {
      jsonField: key,
    }).toString();
  }

  grantRead(grantable: IGrantable) {
    this.secret.grantRead(grantable);
  }
}

export class Database extends Construct {
  readonly layers: {
    readonly query: LayerVersion;
  } = {
    query: new PrismaLayer(this, `${this.node.id}PrismaQueryLayer`, {
      action: 'query',
    }),
  };

  private readonly secret: Secret;

  get environmentVariables() {
    return {
      DATABASE_URL: this.secret.asEnvironmentVariable({key: 'url'}),
    };
  }

  constructor(construct: Construct, {name}: {name: `${string}Database`}) {
    super(construct, `Watch${name}`);

    this.secret = new Secret(this, `Watch${name}Secret`, {
      secretName: `Watch/${name}`,
    });
  }

  grantAccess(grantable: IGrantable & IConnectable) {
    this.secret.grantRead(grantable);
  }
}

export function buildPath(...parts: string[]) {
  return path.resolve(root, 'build', ...parts);
}
