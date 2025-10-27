import fs from "node:fs"; import path from "node:path";
const ROOT = "apps/web-next/app";
if (!fs.existsSync(ROOT)) { console.log("No app/ dir"); process.exit(0); }
const hits = new Map();
function walk(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const p = path.join(d,e.name);
    if(e.isDirectory()) walk(p);
    else if(e.isFile() && /page\.(t|j)sx?$/.test(p)){
      const key = p.replace(/.*app[\\/]/,"").replace(/[\\/]\(.*?\)/g,"/").replace(/\\/g,"/"); // group normalize
      if(!hits.has(key)) hits.set(key,[]);
      hits.get(key).push(p);
    }
  }
}
walk(ROOT);
let moved=0;
for(const [key, arr] of hits){
  if(arr.length>1){
    // En kısa path'i ana sürüm kabul et, diğerlerini _disabled altına taşı
    arr.sort((a,b)=>a.length-b.length);
    for(const p of arr.slice(1)){
      const dstDir = path.join(path.dirname(p), "_disabled");
      fs.mkdirSync(dstDir, { recursive:true });
      const dst = path.join(dstDir, path.basename(p));
      try { fs.renameSync(p, dst); moved++; console.log("DISABLED", p, "→", dst); } catch(e){ console.log("SKIP", p, e.message); }
    }
  }
}
console.log("moved:", moved);
