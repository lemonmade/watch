import {knex as basePlugin, Dialect} from 'sewing-kit-plugin-knex';

export function knex() {
  return basePlugin({dialect: Dialect.Postgres});
}
