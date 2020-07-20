module.exports = {
  schema: 'functions/api/graph/schema.graphql',
  documents: 'app/**/*.graphql',
  extensions: {
    quilt: {
      schemaTypes: [{types: 'input', outputPath: 'app/graphql/types'}],
    },
  },
};
