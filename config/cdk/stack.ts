import 'dotenv/config';

import {App} from '@aws-cdk/core';
import {Vpc} from '@aws-cdk/aws-ec2';

import {Database, Stack, Secret} from '../../global/utilities/infrastructure';

import {WebApp} from '../../app/infrastructure';
import {MigrateDatabase} from '../../functions/migrate/infrastructure';
import {GraphQLApi} from '../../functions/api/infrastructure';
import {AuthApi} from '../../functions/auth/infrastructure';
import {Email} from '../../functions/email/infrastructure';
import {TmdbRefresherScheduler} from '../../functions/tmdb-refresher-scheduler/infrastructure';
import {TmdbRefresher} from '../../functions/tmdb-refresher/infrastructure';
import {CdnRequestForwardHost} from '../../functions/cdn-request-forward-host/infrastructure';
import {CdnResponseHeaderCleanup} from '../../functions/cdn-response-header-cleanup/infrastructure';

import {Cdn} from './cdn';

export class WatchStack extends Stack {
  constructor(app: App) {
    super(app, 'WatchStack');

    const database = new Database(this, {
      vpc: new Vpc(this, 'WatchVpc'),
      name: 'PrimaryDatabase',
      databaseName: 'watch',
    });

    new MigrateDatabase(this, {database});

    const jwt = new Secret(this, 'WatchDefaultJWTSecret', {
      secretName: 'Watch/DefaultJWT',
    });

    const github = new Secret(this, 'WatchGithubOAuthClientSecret', {
      secretName: 'Watch/Github/OAuthCredentials',
    });

    const tmdb = new Secret(this, 'WatchTmdbApiCredentialsSecret', {
      secretName: 'Watch/Tmdb/ApiCredentials',
    });

    const webApp = new WebApp(this);
    const email = new Email(this, {database});
    const graphqlApi = new GraphQLApi(this, {jwt, tmdb, database, email});
    const authApi = new AuthApi(this, {jwt, github, database});

    const tmdbRefreshScheduler = new TmdbRefresherScheduler(this, {database});
    new TmdbRefresher(this, {
      tmdb,
      database,
      scheduler: tmdbRefreshScheduler,
    });

    const cdnRequestForwardHost = new CdnRequestForwardHost(this);
    const cdnResponseHeaderCleanup = new CdnResponseHeaderCleanup(this);

    new Cdn(this, {
      webApp,
      authApi,
      graphqlApi,
      cdnRequestForwardHost,
      cdnResponseHeaderCleanup,
    });
  }
}
