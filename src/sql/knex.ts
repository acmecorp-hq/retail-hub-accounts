import knex, { Knex } from 'knex';
import { config } from '../config';

let dbInstance: Knex | null = null;

export function getDb(): Knex {
  if (dbInstance) return dbInstance;

  if (config.db.client === 'sqlite3') {
    dbInstance = knex({
      client: 'sqlite3',
      connection: {
        filename: config.db.sqlite.filename
      },
      useNullAsDefault: true,
      pool: {
        min: 1,
        max: 1
      }
    });
  } else if (config.db.client === 'pg') {
    dbInstance = knex({
      client: 'pg',
      connection: config.db.pg.connectionString
    });
  } else {
    throw new Error(`Unsupported DB client: ${config.db.client}`);
  }

  return dbInstance;
}
