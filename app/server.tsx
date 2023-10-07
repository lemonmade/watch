import '@quilted/quilt/globals';

import {RequestRouter} from '@quilted/quilt/request-router';

import {handleApp} from './server/app.tsx';
import auth from './server/auth.ts';
import graphql from './server/graphql.ts';

const router = new RequestRouter();

router.any('/api/graphql', graphql);
router.any('/internal/auth', auth);
router.get(handleApp);

export default router;
