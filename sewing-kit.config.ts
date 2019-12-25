import {createWorkspace} from '@sewing-kit/config';
import {quiltWorkspace} from '@quilted/sewing-kit-plugins';

export default createWorkspace((workspace) => {
  workspace.use(quiltWorkspace());
});
