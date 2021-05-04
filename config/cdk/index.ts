import 'dotenv/config';

import {App} from '@aws-cdk/core';

import {WatchStack} from './stacks/main';

const app = new App();
new WatchStack(app);
