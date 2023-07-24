import '@watching/clips/elements';
import {extension, html, type Elements} from '@watching/clips';

import {type SeriesQueryData} from './SeriesQuery.graphql';

export default extension<'series.details.accessory', SeriesQueryData>(
  (root, {query, target}) => {
    const seriesNameText = document.createTextNode('');

    query.subscribe(({series}) => {
      seriesNameText.data = series.name;
    });

    root.append(html<Elements.TextBlock>`
      <ui-text-block>
        You are rendering in the
        <ui-text emphasis>${target}</ui-text> extension point, on a series named
        ${seriesNameText}!
      </ui-text-block>
    `);
  },
);
