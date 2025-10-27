import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { readFile } from "node:fs/promises";
import { runBacktest, type Bar } from "./engine.js";
import smaCross from "./strategies/sma_cross.js";
import rsiContrarian from "./strategies/rsi_contrarian.js";
import breakout from "./strategies/breakout.js";

const argv = await yargs(hideBin(process.argv))
  .option("strategy", { type: "string", demandOption: true })
  .option("file", { type: "string", demandOption: true, describe: "CSV or JSON from marketdata" })
  .option("initial", { type: "number", default: 10_000 })
  .option("fee-bps", { type: "number", default: 10 })
  .option("slippage-bps", { type: "number", default: 5 })
  .option("cash-mode", { type: "string", default: "strict", choices: ["strict", "margin"] })
  .option("max-pos", { type: "number", default: Infinity })
  .option("next-bar-open", { type: "boolean", default: true })
  .parse();

async function loadBars(file: string): Promise<Bar[]> {
  if (file.endsWith(".json")) {
    const { out } = JSON.parse(await readFile(file, "utf8"));
    return out.map((r: any) => ({ ts: r.ts, o: r.o, h: r.h, l: r.l, c: r.c, v: r.v }));
  }
  const txt = await readFile(file, "utf8");
  const [header, ...rows] = txt.trim().split("\n");
  const idx = Object.fromEntries(header.split(",").map((k, i) => [k, i]));
  return rows.map(l => {
    const c = l.split(",");
    return ({
      ts: +c[idx.ts], o: +c[idx.o], h: +c[idx.h], l: +c[idx.l], c: +c[idx.c], v: +c[idx.v]
    });
  });
}

const bars = await loadBars(argv.file as string);
const stratName = String(argv.strategy).toLowerCase();
const strat = stratName === "sma_cross" ? smaCross() :
  stratName === "rsi_contrarian" ? rsiContrarian() :
    stratName === "breakout" ? breakout() : (() => { throw new Error("unknown strategy"); })();

const res = runBacktest(bars, strat as any, { 
  initial: argv.initial as number, 
  feeBps: argv["fee-bps"] as number, 
  slipBps: argv["slippage-bps"] as number,
  cashMode: argv["cash-mode"] as "strict" | "margin",
  maxPos: argv["max-pos"] as number,
  useNextBarOpen: argv["next-bar-open"] as boolean
});
console.log(JSON.stringify({ ok: true, ...res }));
