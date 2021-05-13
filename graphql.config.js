module.exports = {
  projects: {
    default: {
      schema: 'functions/api/graph/schema.graphql',
      documents: [
        'app/**/*.graphql',
        'packages/cli/src/publish/**/*.graphql',
        'packages/cli/src/push/**/*.graphql',
        'packages/cli/src/app/**/*.graphql',
        'packages/cli/src/authentication/**/*.graphql',
      ],
      exclude: [
        'app/foundation/LocalDevelopmentOrchestrator/graphql/LocalDevelopmentOrchestratorQuery.graphql',
      ],
      extensions: {
        quilt: {
          documents: [
            {
              kind: 'value',
              match: ['packages/**/*.graphql'],
            },
          ],
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
      schema: 'packages/cli/src/develop/schema.graphql',
      documents:
        'app/foundation/LocalDevelopmentOrchestrator/graphql/LocalDevelopmentOrchestratorQuery.graphql',
      extensions: {
        quilt: {
          schema: [
            {kind: 'definitions'},
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
