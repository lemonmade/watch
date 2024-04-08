import {handleFetch} from './handlers/fetch.ts';
import {handleQueue} from './handlers/queue.ts';
import {handleScheduled} from './handlers/schedule.ts';

export default {
  fetch: handleFetch,
  queue: handleQueue,
  scheduled: handleScheduled,
};
