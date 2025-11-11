import 'dotenv/config';
import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = {
  host: isProduction
    ? process.env.DB_HOST_PROD || 'db-pool.vuwgaqfrgvfsjsznmoir.supabase.co'
    : process.env.DB_HOST || 'db.vuwgaqfrgvfsjsznmoir.supabase.co',
  port: isProduction
    ? process.env.DB_PORT_PROD || 6543
    : process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  allowExitOnIdle: true,
};

const pool = new Pool(dbConfig);

export { pool };
