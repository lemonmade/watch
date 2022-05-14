import type {Configuration} from '@quilted/craft/graphql';

const config: Configuration = {
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
        'app/features/Developer/Console/graphql/DeveloperConsoleQuery.graphql',
        'app/foundation/LocalDevelopmentOrchestrator/graphql/LocalDevelopmentOrchestratorQuery.graphql',
      ],
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'definitions',
              outputPath: 'functions/api/graphql/schema.ts',
            },
            {kind: 'inputTypes', outputPath: 'app/graphql/types.d.ts'},
          ],
        },
      },
    },
    cli: {
      schema: 'packages/cli/src/commands/develop/schema.graphql',
      documents: [
        'app/features/Developer/Console/graphql/DeveloperConsoleQuery.graphql',
        'app/foundation/LocalDevelopmentOrchestrator/graphql/LocalDevelopmentOrchestratorQuery.graphql',
      ],
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
