import * as path from 'path';
import {upload} from '@quilted/asset-upload-s3';

import {
  CDN_BUCKET,
  DEFAULT_REGION,
  ASSET_UPLOAD_BUCKET,
} from '../config/deploy/constants';

upload({
  prefix: 'watch',
  region: DEFAULT_REGION,
  bucket: CDN_BUCKET,
  buildDirectory: path.resolve('build/app'),
  ignore: ['quiltAutoServer/**/*'],
  manifest: {
    bucket: ASSET_UPLOAD_BUCKET,
  },
});
