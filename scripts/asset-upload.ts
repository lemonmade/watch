import * as path from 'path';
import {upload} from '@quilted/asset-upload-s3';

import {
  CDN_BUCKET,
  CDN_PREFIX,
  DEFAULT_REGION,
  ASSET_UPLOAD_BUCKET,
} from '../config/deploy/constants';

upload({
  prefix: CDN_PREFIX,
  region: DEFAULT_REGION,
  bucket: CDN_BUCKET,
  buildDirectory: path.resolve('build/app'),
  ignore: ['quiltAutoServer/**/*'],
  manifest: {
    bucket: ASSET_UPLOAD_BUCKET,
  },
});
