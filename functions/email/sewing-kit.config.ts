import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({
      react: true,
      develop: false,
      httpHandler: true,
    }),
  );
});
