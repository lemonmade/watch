import {extension, TextBlock, Text, getQuery} from '@watching/clips';
import {type SeriesQueryData} from './SeriesQuery.graphql';

export default extension((root, {query, target}) => {
  const {series} = getQuery<SeriesQueryData>(query);

  const seriesNameText = root.createText(series.name);

  query.subscribe(() => {
    const {series} = getQuery<SeriesQueryData>(query);
    seriesNameText.updateText(series.name);
  });

  root.appendChild(
    root.createComponent(TextBlock, {}, [
      'You are rendering in the ',
      root.createComponent(Text, {emphasis: true}, target),
      ' extension point, on a series named ',
      root.createComponent(Text, {emphasis: true}, seriesNameText),
      '!',
    ]),
  );
});
