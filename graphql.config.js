module.exports = {
  projects: {
    default: {
      schema: 'functions/api/graph/schema.graphql',
      documents: ['app/**/*.graphql', 'packages/cli/src/deploy/**/*.graphql'],
      exclude: [
        'app/foundation/LocalDevelopmentOrchestrator/graphql/LocalDevelopmentOrchestratorQuery.graphql',
      ],
      extensions: {
        quilt: {
          schemaTypes: [
            {types: 'output'},
            {types: 'input', outputPath: 'app/graphql/types.d.ts'},
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
          schemaTypes: [
            {types: 'output'},
            {types: 'input', outputPath: 'app/graphql/types/cli.d.ts'},
          ],
        },
      },
    },
  },
};
