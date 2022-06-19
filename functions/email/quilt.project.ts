import {createService, quiltService} from '@quilted/craft';

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({
      react: true,
      develop: false,
      polyfill: {
        features: ['fetch'],
      },
    }),
  );
});
