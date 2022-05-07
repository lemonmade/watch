import type {GraphQL} from '@quilted/graphql';

import {PrintableError} from '../../ui';
import type {Ui} from '../../ui';

import type {LocalApp, LocalExtension} from './local';

import findAppMatchingLocalDevelopmentQuery from './graphql/FindAppMatchingLocalDevelopmentQuery.graphql';
import type {FindAppMatchingLocalDevelopmentQueryData} from './graphql/FindAppMatchingLocalDevelopmentQuery.graphql';
import createAppFromLocalAppMutation from './graphql/CreateAppFromLocalAppMutation.graphql';

export type ProductionApp = FindAppMatchingLocalDevelopmentQueryData.Me.App;
export type ProductionExtension =
  FindAppMatchingLocalDevelopmentQueryData.Me.App.Extensions;
export type ProductionClipsExtension =
  FindAppMatchingLocalDevelopmentQueryData.Me.App.Extensions_ClipsExtension;

export async function loadProductionApp(
  {id, name}: LocalApp,
  {ui, graphql}: {ui: Ui; graphql: GraphQL},
): Promise<ProductionApp> {
  const {data} = await graphql.query(findAppMatchingLocalDevelopmentQuery, {
    cache: false,
    variables: {id, name},
  });

  const app = data?.me.app;

  if (app == null) {
    if (id) {
      throw new PrintableError(
        `We could not find an app with id ${ui.Code(
          id,
        )}. Try removing the ${ui.Code('id')} field from your ${ui.Code(
          'app.toml',
        )} before running the command again.`,
      );
    }

    if (!ui.isInteractive) {
      throw new PrintableError(
        `We could not find an app with name ${ui.Code(
          name,
        )}, and you are not running this command in an interactive context, so we don’t know if it’s safe to create an app for you. Please run this command locally to create your app for the first time, or run this command with the ${ui.Code(
          '--yes',
        )} flag to automatically agree to all prompts.`,
      );
    }

    ui.TextBlock(
      `We couldn’t find a production app for ${ui.Code(
        name,
      )}, so we’re creating it now...`,
    );

    const {data} = await graphql.mutate(createAppFromLocalAppMutation, {
      variables: {name},
    });

    const newApp = data?.createApp.app;

    if (newApp) {
      return newApp;
    }

    throw new PrintableError(
      `We failed to create an app named ${ui.Code(
        name,
      )}. This shouldn’t happen... Hopefully if you try again in a moment, this will resolve itself. If not, please open an issue describing what you did at ${ui.Link(
        'https://github.com/lemonmade/watch/issues/new',
      )}, and sorry for the inconvenience!`,
    );
  }

  return app;
}

export function findMatchingProductionClipsExtension(
  extension: LocalExtension,
  app: ProductionApp,
) {
  return app.extensions.find(
    (productionExtension) =>
      productionExtension.__typename === 'ClipsExtension' &&
      (productionExtension.id === extension.id ||
        productionExtension.name === extension.name),
  ) as ProductionClipsExtension | undefined;
}
