import {createService} from '@sewing-kit/config';
import {quiltServicePlugin} from '@quilted/sewing-kit-plugins';

export default createService((service) => {
  service.entry('./index');
  service.plugin(quiltServicePlugin);
});
