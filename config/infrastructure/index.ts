import 'dotenv/config';

import {App} from '@aws-cdk/core';

import {WatchStack} from './stacks/main';
import {WatchMigrateDatabaseStack} from './stacks/migrate-database';

const app = new App();

new WatchStack(app);
new WatchMigrateDatabaseStack(app);
