import {createPackage, quiltPackage} from '@quilted/craft';

export default createPackage((pkg) => {
  pkg.binary({name: 'watchapp', source: './src/cli'});
  pkg.use(quiltPackage({graphql: true}));
});
