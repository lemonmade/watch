import {extension, getQuery} from '@watching/clips';
import {type SeriesQueryData} from './SeriesQuery.graphql';

export default extension((root, {query, target}) => {
  const {series} = getQuery<SeriesQueryData>(query);

  const seriesNameText = document.createTextNode(series.name);

  query.subscribe(() => {
    const {series} = getQuery<SeriesQueryData>(query);
    seriesNameText.data = series.name;
  });

  const seriesText = document.createElement('ui-text');
  seriesText.emphasis = true;
  seriesText.append(seriesNameText);

  const targetText = document.createElement('ui-text');
  targetText.emphasis = true;
  targetText.append(target);

  const textBlock = document.createElement('ui-text-block');
  textBlock.append(
    'You are rendering in the ',
    targetText,
    ' extension point, on a series named ',
    seriesText,
    '!',
  );

  root.append(textBlock);
});
