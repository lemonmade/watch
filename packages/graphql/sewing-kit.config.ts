import {createPackage, quiltPackage} from '@quilted/craft';

export default createPackage((pkg) => {
  pkg.entry({source: './src'});
  pkg.entry({name: 'server', source: './src/server'});
  pkg.use(quiltPackage({graphql: true}));
});
