import mysql from 'mysql2/promise';
import sql from 'mssql';
import { getDbType } from '../services/getDbType.service';

const dbType = getDbType();

let poolPromise: any = null;
let pool: any = null;

if (dbType === 'mssql') {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then((connectedPool) => {
      console.log('Connected to MSSQL');
      return connectedPool;
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
      throw err;
    });
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

export { sql, poolPromise, pool };