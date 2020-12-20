import {App} from '@aws-cdk/core';
import {LemonCdnStack} from './stacks/LemonCdnStack';

const app = new App();
new LemonCdnStack(app);
