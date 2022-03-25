import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/craft';

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({
      react: true,
      develop: false,
      httpHandler: false,
    }),
    lambda(),
  );
});
