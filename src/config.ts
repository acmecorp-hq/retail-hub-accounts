export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  basePath: '/v1/accounts',
  jwtSecret: process.env.ACCOUNTS_JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresInSeconds: parseInt(process.env.ACCOUNTS_JWT_EXPIRES_IN || '86400', 10),
  sessionCookieEnabled: process.env.ACCOUNTS_SESSION_COOKIE !== 'false',
  cookieName: 'rh_session',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  db: {
    client: (process.env.DB_CLIENT || 'sqlite3') as 'sqlite3' | 'pg',
    sqlite: {
      filename: process.env.DB_SQLITE_FILE || ':memory:'
    },
    pg: {
      connectionString: process.env.DATABASE_URL || ''
    }
  }
};
