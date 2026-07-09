const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString
    });
  }

  return pool;
}

module.exports = {
  getPool
};
