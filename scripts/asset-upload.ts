import * as path from 'path';
import {uploadToS3} from '@quilted/aws';

import {
  CDN_BUCKET,
  CDN_PREFIX,
  DEFAULT_REGION,
  ASSET_UPLOAD_BUCKET,
} from '../config/deploy/constants';

uploadToS3({
  prefix: CDN_PREFIX,
  region: DEFAULT_REGION,
  bucket: CDN_BUCKET,
  buildDirectory: path.resolve('build/app'),
  ignore: ['server/**/*'],
  manifest: {
    bucket: ASSET_UPLOAD_BUCKET,
  },
});
