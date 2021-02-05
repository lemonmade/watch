import {App} from '@aws-cdk/core';
import {WatchAppStack} from './deploy-stack';

const app = new App();
new WatchAppStack(app);
