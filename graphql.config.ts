import type {IGraphQLConfig} from 'graphql-config';

const config: IGraphQLConfig = {
  projects: {
    default: {
      schema: 'graphql/main/*schema.graphql',
      documents: [
        'app/**/*.graphql',
        'packages/cli/src/commands/publish/**/*.graphql',
        'packages/cli/src/commands/push/**/*.graphql',
        'packages/cli/src/utilities/app/**/*.graphql',
        'packages/cli/src/utilities/authentication/**/*.graphql',
      ],
      exclude: [
        'app/foundation/LocalDevelopmentOrchestrator/graphql/LocalDevelopmentOrchestratorQuery.graphql',
      ],
      extensions: {
        quilt: {
          schema: [
            {kind: 'definitions', outputPath: 'functions/api/graph/schema.ts'},
            {
              kind: 'inputTypes',
              outputPath: 'functions/api/graph/schema-input-types.d.ts',
            },
            {kind: 'inputTypes', outputPath: 'app/graphql/types.d.ts'},
          ],
        },
      },
    },
    cli: {
      schema: 'packages/cli/src/commands/develop/schema.graphql',
      documents:
        'app/foundation/LocalDevelopmentOrchestrator/graphql/LocalDevelopmentOrchestratorQuery.graphql',
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'definitions',
              outputPath: 'packages/cli/src/commands/develop/schema.ts',
            },
            {kind: 'inputTypes', outputPath: 'app/graphql/types/cli.d.ts'},
          ],
        },
      },
    },
    github: {
      schema: 'graphql/github/schema.graphql',
      documents: 'functions/auth/handlers/github/**/*.graphql',
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'inputTypes',
              outputPath: 'functions/auth/handlers/github/graphql/schema.d.ts',
            },
          ],
        },
      },
    },
  },
};

export default config;
