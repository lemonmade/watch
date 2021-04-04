import type {ReactElement} from 'react';

import {extract} from '@quilted/react-server-render/server';
import type {Options as ExtractOptions} from '@quilted/react-server-render/server';
import {HtmlManager, HtmlContext} from '@quilted/react-html/server';

import {EmailContext} from './context';
import {EmailManager} from './manager';

interface Options extends ExtractOptions {}

export async function runEmail(
  app: ReactElement<any>,
  {decorate, ...rest}: Options = {},
) {
  const html = new HtmlManager();
  const email = new EmailManager();

  const markup = await extract(app, {
    // eslint-disable-next-line react/function-component-definition
    decorate(app) {
      return (
        <EmailContext.Provider value={email}>
          <HtmlContext.Provider value={html}>
            {decorate?.(app) ?? app}
          </HtmlContext.Provider>
        </EmailContext.Provider>
      );
    },
    ...rest,
  });

  return {markup, html, email};
}
