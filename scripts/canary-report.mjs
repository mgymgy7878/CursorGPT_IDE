#!/usr/bin/env node
/**
 * evidence/canary/INDEX.csv içinden YYYY-MM-DD için SUMMARY.json üretir.
 */
import fs from "node:fs";
import path from "node:path";

const dateArg = process.argv[2]; // YYYY-MM-DD
const today = new Date();
const y = today.getFullYear(), m = String(today.getMonth()+1).padStart(2,"0"), d = String(today.getDate()).padStart(2,"0");
const day = dateArg || `${y}-${m}-${d}`;

const root = path.resolve(process.cwd(),"evidence","canary");
const indexPath = path.join(root,"INDEX.csv");
if (!fs.existsSync(indexPath)) {
  console.error("INDEX.csv not found"); process.exit(2);
}
const lines = fs.readFileSync(indexPath,"utf8").split("\n").filter(Boolean);
const header = lines.shift()!;
const idx = (name)=> header.split(",").indexOf(name);
const tsIdx = idx("ts"), decisionIdx = idx("decision"), nonceIdx = idx("nonce");

const rows = lines.map(l=>l.split(",")).filter(cols => (cols[tsIdx]||"").includes(day));
const total = rows.length;
const decisions = rows.reduce((acc, cols)=>{
  const d = (cols[decisionIdx]||"").replace(/"/g,""); acc[d]=(acc[d]||0)+1; return acc;
}, {} as Record<string,number>);
const nonces = rows.map(cols=>cols[nonceIdx]?.replace(/"/g,"")).filter(Boolean);

const outDir = path.join(root,"reports",day);
fs.mkdirSync(outDir,{recursive:true});
const summary = { day, total, decisions, nonces };
fs.writeFileSync(path.join(outDir,"SUMMARY.json"), JSON.stringify(summary,null,2), "utf8");
fs.writeFileSync(path.join(outDir,"README.txt"), `Canary daily summary for ${day}\nrows=${total}\n`, "utf8");
console.log("WROTE", path.join(outDir,"SUMMARY.json")); 