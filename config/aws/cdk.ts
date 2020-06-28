import {App} from '@aws-cdk/core';
import {WatchStack} from './stack';

const app = new App();
new WatchStack(app);
