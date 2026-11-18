// Apply db/schema.sql and seed jc_content from content/site.json if empty.
// Usage: node scripts/db-apply.mjs  (reads DATABASE_URL from .env.local)
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const sql = neon(process.env.DATABASE_URL || env.DATABASE_URL);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
for (const stmt of schema.split(";").map((s) => s.replace(/--.*$/gm, "").trim()).filter(Boolean)) await sql.query(stmt);
const site = JSON.parse(readFileSync(new URL("../content/site.json", import.meta.url), "utf8"));
const force = process.argv.includes("--force");
const rows = await sql`select id from jc_content where id = 'site'`;
if (!rows.length || force) {
  await sql`insert into jc_content (id, data, updated_by) values ('site', ${JSON.stringify(site)}::jsonb, 'seed')
            on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = 'seed'`;
  console.log("seeded content");
} else console.log("content exists, left as is (use --force to overwrite)");
console.log("tables:", (await sql`select table_name from information_schema.tables where table_name like 'jc_%' order by 1`).map((r) => r.table_name).join(", "));
