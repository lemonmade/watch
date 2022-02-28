import {createService, quiltService} from '@quilted/craft';

export default createService((service) => {
  service.entry('./local-proxy');
  service.use(
    quiltService({
      develop: false,
      httpHandler: false,
    }),
  );
});
