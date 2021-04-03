import knex from 'knex';

export enum Table {
  Users = 'Users',
  Watches = 'Watches',
  Skips = 'Skips',
  Series = 'Series',
  SeriesSubscriptions = 'SeriesSubscriptions',
  Seasons = 'Seasons',
  Episodes = 'Episodes',
  WatchThroughs = 'WatchThroughs',
  WatchThroughEpisodes = 'WatchThroughEpisodes',
  Apps = 'Apps',
  ClipsExtensions = 'ClipsExtensions',
  ClipsExtensionVersions = 'ClipsExtensionVersions',
  AppInstallations = 'AppInstallations',
  ClipsExtensionInstallations = 'ClipsExtensionInstallations',
  GithubAccounts = 'GithubAccounts',
}

export type Database = ReturnType<typeof createDatabaseConnection>;

export function createDatabaseConnection() {
  return knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
  });
}
