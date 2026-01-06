import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Drop all tables in correct order
await connection.query("DROP TABLE IF EXISTS messages");
await connection.query("DROP TABLE IF EXISTS sessions");
await connection.query("DROP TABLE IF EXISTS agents");
await connection.query("DROP TABLE IF EXISTS widgets");
await connection.query("DROP TABLE IF EXISTS __drizzle_migrations");

console.log("All tables dropped successfully");
await connection.end();
