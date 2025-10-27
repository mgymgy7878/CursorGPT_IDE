import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const inFile = process.argv[2] ?? "./data/BTCUSDT_1m.json";

async function run() {
  const { out, meta } = JSON.parse(await readFile(inFile, "utf8"));
  const lines = ["ts,exchange,symbol,tf,o,h,l,c,v,qv,n,vwap"];
  for (const r of out) {
    lines.push(`${r.ts},${r.exchange},${r.symbol},${r.tf},${r.o},${r.h},${r.l},${r.c},${r.v},${r.qv},${r.n},${r.vwap}`);
  }
  const outPath = inFile.replace(".json", ".csv");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, lines.join("\n"));
  console.log(JSON.stringify({ ...meta, csv: outPath }));
}

run().catch(e => { console.error(e); process.exit(1); });
