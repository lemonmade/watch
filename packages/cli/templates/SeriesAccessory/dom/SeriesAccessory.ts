import {extension, getQuery, Text} from '@watching/clips-dom';
import {type SeriesQueryData} from './SeriesQuery.graphql';

export default extension((root, {query, target}) => {
  const {series} = getQuery<SeriesQueryData>(query);

  const seriesNameText = document.createTextNode(series.name);

  query.subscribe(() => {
    const {series} = getQuery<SeriesQueryData>(query);
    seriesNameText.data = series.name;
  });

  const seriesText = document.createElement(Text);
  seriesText.emphasis = true;
  seriesText.append(seriesNameText);

  const targetText = document.createElement(Text);
  targetText.emphasis = true;
  targetText.append(target);

  const text = document.createElement(Text);
  text.append(
    'You are rendering in the ',
    targetText,
    ' extension point, on a series named ',
    seriesText,
    '!',
  );

  root.append(text);
});
