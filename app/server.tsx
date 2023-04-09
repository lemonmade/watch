import '@quilted/quilt/global';

import {createRequestRouter} from '@quilted/quilt/server';

import app from './server/app.tsx';
import auth from './server/auth.ts';
import graphql from './server/graphql.ts';

const router = createRequestRouter();

router.any('/api/graphql', graphql);
router.any('/internal/auth', auth);
router.get(app);

export default router;
