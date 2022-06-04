import {App} from '@aws-cdk/core';
import {Vpc} from '@aws-cdk/aws-ec2';

import {
  Database,
  Stack,
  Secret,
} from '../../../global/utilities/infrastructure';

import {WebApp} from '../../../app/infrastructure';
import {GraphQLApi} from '../../../functions/api/infrastructure';
import {AuthApi} from '../../../functions/auth/infrastructure';
import {Email} from '../../../functions/email/infrastructure';
import {TmdbRefresherScheduler} from '../../../functions/tmdb-refresher-scheduler/infrastructure';
import {TmdbRefresher} from '../../../functions/tmdb-refresher/infrastructure';

export class WatchStack extends Stack {
  constructor(app: App) {
    super(app, 'WatchStack');

    const database = new Database(this, {
      vpc: new Vpc(this, 'WatchVpc'),
      name: 'PrimaryDatabase',
      databaseName: 'watch',
    });

    const jwt = new Secret(this, 'WatchDefaultJWTSecret', {
      secretName: 'Watch/DefaultJWT',
    });

    const github = new Secret(this, 'WatchGithubOAuthClientSecret', {
      secretName: 'Watch/Github/OAuthCredentials',
    });

    const tmdb = new Secret(this, 'WatchTmdbApiCredentialsSecret', {
      secretName: 'Watch/Tmdb/ApiCredentials',
    });

    new WebApp(this);
    const email = new Email(this, {database});
    new GraphQLApi(this, {jwt, tmdb, database, email});
    new AuthApi(this, {jwt, github, database});

    const refresher = new TmdbRefresher(this, {
      tmdb,
      database,
    });
    new TmdbRefresherScheduler(this, {
      database,
      refresher,
    });
  }
}
