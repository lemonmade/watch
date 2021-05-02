import 'dotenv/config';

import {App} from '@aws-cdk/core';

import {GlobalInfrastructureStack} from '../../global/infrastructure';
import {AppStack} from '../../app/infrastructure';
import {GraphQLApiStack} from '../../functions/api/infrastructure';
import {AuthApiStack} from '../../functions/auth/infrastructure';
import {EmailStack} from '../../functions/email/infrastructure';
import {TmdbRefresherSchedulerStack} from '../../functions/tmdb-refresher-scheduler/infrastructure';
import {TmdbRefresherStack} from '../../functions/tmdb-refresher/infrastructure';
import {CdnRequestForwardHostStack} from '../../functions/cdn-request-forward-host/infrastructure';
import {CdnResponseHeaderCleanupStack} from '../../functions/cdn-response-header-cleanup/infrastructure';

import {CdnStack} from './cdn';

const app = new App();

const globalStack = new GlobalInfrastructureStack(app);
const emailStack = new EmailStack(app, {global: globalStack});

const appStack = new AppStack(app);

const graphqlApiStack = new GraphQLApiStack(app, {
  global: globalStack,
  email: emailStack,
});

const authStack = new AuthApiStack(app, {global: globalStack});

const tmdbRefresherSchedulerStack = new TmdbRefresherSchedulerStack(app, {
  global: globalStack,
});

new TmdbRefresherStack(app, {
  global: globalStack,
  scheduler: tmdbRefresherSchedulerStack,
});

const cdnRequestForwardHostStack = new CdnRequestForwardHostStack(app);
const cdnResponseHeaderCleanupStack = new CdnResponseHeaderCleanupStack(app);

new CdnStack(app, {
  app: appStack,
  auth: authStack,
  graphqlApi: graphqlApiStack,
  cdnRequestForwardHost: cdnRequestForwardHostStack,
  cdnResponseHeaderCleanup: cdnResponseHeaderCleanupStack,
});
