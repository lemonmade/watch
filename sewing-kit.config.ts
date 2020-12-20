import {createWorkspace} from '@sewing-kit/config';
import {
  createWorkspaceLintPlugin,
  createWorkspaceTypeCheckPlugin,
} from '@sewing-kit/plugins';
import {quiltWorkspace} from '@quilted/sewing-kit-plugins';

export default createWorkspace((workspace) => {
  workspace.use(quiltWorkspace());
  workspace.use(
    createWorkspaceTypeCheckPlugin('Quilt.GraphQL', ({hooks}) => {
      hooks.pre.hook((steps) => [
        ...steps,
        {
          id: 'Quilt.GraphQL',
          label: 'build graphql typescript definitions',
          async run(runner) {
            await runner.exec('node_modules/.bin/quilt-graphql-typescript');
          },
        },
      ]);
    }),
    createWorkspaceLintPlugin('Lint.RemoveGraphQL', ({hooks}) => {
      hooks.configure.hook(({eslintExtensions}) => {
        eslintExtensions?.hook((extensions) =>
          extensions.filter(
            (extension) => !/\.?(graphql|gql)$/.test(extension),
          ),
        );
      });
    }),
  );
});
