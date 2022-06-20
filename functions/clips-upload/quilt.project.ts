import {createService, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createService((service) => {
  service.entry('./clips-upload');
  service.use(
    quiltService({
      develop: false,
    }),
    cloudflareWorkers({
      cache: false,
    }),
  );
});
