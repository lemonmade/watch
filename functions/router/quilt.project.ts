import {createService, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createService((service) => {
  service.entry('./router');
  service.use(
    quiltService({
      develop: false,
      httpHandler: false,
    }),
    cloudflareWorkers(),
  );
});
