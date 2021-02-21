module.exports = {
  projects: {
    default: {
      schema: 'functions/api/graph/schema.graphql',
      documents: [
        'app/**/*.graphql',
        'packages/cli/src/deploy/**/*.graphql',
        'packages/cli/src/publish/**/*.graphql',
        'packages/cli/src/app/**/*.graphql',
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
            {kind: 'outputTypes'},
            {kind: 'inputTypes', outputPath: 'app/graphql/types.d.ts'},
          ],
        },
      },
    },
    cli: {
      schema: 'packages/cli/src/dev/schema.graphql',
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
  },
};
