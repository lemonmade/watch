module.exports = {
  projects: {
    default: {
      schema: 'functions/api/graph/schema.graphql',
      documents: 'app/**/*.graphql',
      exclude: [
        'app/foundation/LocalDevOrchestrator/graphql/LocalDevOrchestratorQuery.graphql',
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
        'app/foundation/LocalDevOrchestrator/graphql/LocalDevOrchestratorQuery.graphql',
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
