import {createWebApp} from '@sewing-kit/config';
import {quiltWebAppPlugin} from '@quilted/sewing-kit-plugins';

export default createWebApp((app) => {
  app.entry('./index');
  app.plugin(quiltWebAppPlugin);
});
