import { readFile } from "node:fs/promises";
import { Client } from "pg";

const url = process.env.DATABASE_URL!;
const file = process.argv[2] ?? "./data/BTCUSDT_1m.csv";

async function run() {
  const cli = new Client({ connectionString: url });
  await cli.connect();
  await cli.query(`CREATE TABLE IF NOT EXISTS ohlcv(
    ts BIGINT, exchange TEXT, symbol TEXT, tf TEXT,
    o NUMERIC, h NUMERIC, l NUMERIC, c NUMERIC,
    v DOUBLE PRECISION, qv DOUBLE PRECISION, n INT, vwap DOUBLE PRECISION,
    PRIMARY KEY (exchange, symbol, tf, ts)
  );`);
  await cli.query(`CREATE INDEX IF NOT EXISTS ohlcv_ts_idx ON ohlcv USING BRIN(ts);`);
  await cli.query(`CREATE INDEX IF NOT EXISTS ohlcv_symbol_tf_idx ON ohlcv(symbol, tf);`);
  await cli.query(`TRUNCATE TABLE staging_ohlcv;`).catch(() => {});
  await cli.query(`CREATE TEMP TABLE staging_ohlcv (LIKE ohlcv INCLUDING ALL);`);
  await cli.query(`COPY staging_ohlcv FROM STDIN WITH CSV HEADER`);
  console.error("Use psql \\\\copy for large CSV in CI; this is a stub.");
  await cli.end();
}

run().catch(e => { console.error(e); process.exit(1); });
