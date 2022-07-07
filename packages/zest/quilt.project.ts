import {createProject, quiltPackage} from '@quilted/craft';

export default createProject((pkg) => {
  pkg.use(quiltPackage({react: true}));
});
