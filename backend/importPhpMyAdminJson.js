require("./config/env");

const fs = require("node:fs/promises");
const path = require("node:path");
const db = require("./config/db");
const { ensureSchema } = require("./initDatabase");

const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, "``")}\``;

const importRows = async (tableName, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  let imported = 0;

  for (const row of rows) {
    const columns = Object.keys(row);
    if (columns.length === 0) {
      continue;
    }

    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns
      .filter((column) => column !== "id")
      .map((column) => `${quoteIdentifier(column)} = VALUES(${quoteIdentifier(column)})`)
      .join(", ");
    const sql = `INSERT INTO ${quoteIdentifier(tableName)} (${columns.map(quoteIdentifier).join(", ")})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updates || `${quoteIdentifier(columns[0])} = ${quoteIdentifier(columns[0])}`}`;

    await db.query(sql, columns.map((column) => row[column]));
    imported += 1;
  }

  return imported;
};

const main = async () => {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: node backend/importPhpMyAdminJson.js <path-to-lintara.json>");
  }

  const resolvedPath = path.resolve(inputPath);
  const payload = JSON.parse(await fs.readFile(resolvedPath, "utf8"));
  const tables = Array.isArray(payload) ? payload.filter((item) => item?.type === "table") : [];

  await ensureSchema();

  for (const table of tables) {
    const count = await importRows(table.name, table.data);
    console.log(`${table.name}: ${count} rows imported`);
  }

  await db.end();
};

main().catch(async (error) => {
  console.error("Import failed:", error.message || error);
  await db.end();
  process.exit(1);
});
