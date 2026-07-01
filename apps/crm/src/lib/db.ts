// Path: lib/db.ts
import mysql from 'mysql2/promise';

let internalPool: any = null;

function getPool() {
  if (!internalPool) {
    internalPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return internalPool;
}

// Use a Proxy to lazy-load the mysql pool.
// This prevents connection handles from being opened during next build imports,
// avoiding Node/libuv crashes on worker thread exit.
const pool = new Proxy({} as any, {
  get(target, prop) {
    const p = getPool();
    const value = p[prop];
    if (typeof value === 'function') {
      return value.bind(p);
    }
    return value;
  }
});

export default pool;

