import '@quilted/quilt/global';

import {createHttpHandler} from '@quilted/quilt/server';

import appHandler from './server/app';
import authHandler from './server/auth';
import graphqlHandler from './server/graphql';

const httpHandler = createHttpHandler();

httpHandler.any('/api/graphql', graphqlHandler);
httpHandler.any('/internal/auth', authHandler);
httpHandler.get(appHandler);

export default httpHandler;
