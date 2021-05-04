import {App} from '@aws-cdk/core';

import {MigrateDatabase} from '../../../functions/migrate/infrastructure';
import {Stack} from '../../../global/utilities/infrastructure';

export class WatchMigrateDatabaseStack extends Stack {
  constructor(app: App) {
    super(app, 'WatchMigrateDatabaseStack');

    new MigrateDatabase(this);
  }
}
