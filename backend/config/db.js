require("./env");

const mysql = require("mysql2/promise");

const getConnectionConfig = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);

    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
    };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lintara",
  };
};

const db = mysql.createPool({
  ...getConnectionConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
});

const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log("MySQL terhubung");
    connection.release();
  } catch (err) {
    console.error("Database gagal terhubung");
    console.error(err.message || err);
  }
};

void testConnection();

module.exports = db;
