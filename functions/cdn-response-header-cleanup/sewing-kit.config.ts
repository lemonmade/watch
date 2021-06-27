import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/sewing-kit';

export default createService((service) => {
  service.entry('./cdn-response-header-cleanup');
  service.use(
    quiltService({
      develop: false,
      httpHandler: false,
    }),
    lambda(),
  );
});
