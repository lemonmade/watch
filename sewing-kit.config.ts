import {createWorkspace} from '@sewing-kit/config';
import {createWorkspaceLintPlugin} from '@sewing-kit/plugins';
import {quiltWorkspace} from '@quilted/sewing-kit-plugins';

export default createWorkspace((workspace) => {
  workspace.use(quiltWorkspace());
  workspace.use(
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
