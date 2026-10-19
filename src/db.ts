import pg from "pg";

export const pool = new pg.Pool({
  connectionString: "postgres://postgres:postgres@localhost:5433/rag",
});