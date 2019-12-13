import {createWorkspace} from '@sewing-kit/config';
import {quiltWorkspacePlugin} from '@quilted/sewing-kit-plugins';

export default createWorkspace((workspace) => {
  workspace.plugin(quiltWorkspacePlugin);
});
