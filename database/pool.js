import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '12345',
  database: 'libreria',
  port: 5432,
  allowExitOnIdle: true,
});

export { pool };