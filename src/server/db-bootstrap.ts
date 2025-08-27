import { getDb } from '../sql/knex';

export async function attachDbAndMigrate(): Promise<void> {
  const db = getDb();
  // Create schema if not exists
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (t) => {
      t.string('id').primary();
      t.string('username').notNullable().unique();
      t.string('email').notNullable().unique();
      t.string('password_hash').notNullable();
      t.string('given_name');
      t.string('family_name');
      t.string('avatar_url');
      t.string('address_line1');
      t.string('address_line2');
      t.string('address_city');
      t.string('address_state');
      t.string('address_postal_code');
      t.string('address_country');
      t.string('created_at').notNullable();
      t.string('updated_at').notNullable();
    });
  }
}
