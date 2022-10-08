/* eslint no-console: off */

import {updateSeries} from '~/global/tmdb';
import {createPrisma} from '~/shared/utilities/database';
import {createPubSubHandler} from '~/shared/utilities/pubsub';

const prismaPromise = createPrisma();

export default createPubSubHandler<{id: string; name: string; tmdbId: string}>(
  async ({id, name, tmdbId}) => {
    try {
      const {results} = await updateSeries({
        id,
        name,
        tmdbId,
        prisma: await prismaPromise,
      });

      const result = results.join('\n\n');
      console.log(result);

      const fetchResult = await fetch(
        'https://discordapp.com/api/webhooks/656640833063223325/1ofugrkDFpqaSAWvD6mLlg5EN3UDOfBdib4WKNE17Q5YxUoz8wpwuLoKCeaZJqCHyfeC',
        {
          method: 'POST',
          body: JSON.stringify({
            content: result,
          }),
          headers: {'Content-Type': 'application/json'},
        },
      );

      console.log(fetchResult);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
);
