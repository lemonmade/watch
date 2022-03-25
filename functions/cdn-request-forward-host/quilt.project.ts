import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/craft';

export default createService((service) => {
  service.entry('./cdn-request-forward-host');
  service.use(
    quiltService({
      develop: false,
      httpHandler: false,
    }),
    lambda(),
  );
});
