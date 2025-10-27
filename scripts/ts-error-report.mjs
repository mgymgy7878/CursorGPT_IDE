import { spawn } from "node:child_process";

const child = spawn("npx", ["tsc", "--noEmit", "--pretty", "false"]);
let out = "";
child.stdout.on("data", d => out += d);
let err = "";
child.stderr.on("data", d => err += d);

child.on("close", () => {
  const lines = (out + err).split("\n").filter(Boolean);
  const map = new Map();
  
  for (const ln of lines) {
    // format: path(line,col): error TSxxxx:
    const m = ln.match(/^(.+?):\d+:\d+ - error TS\d+:/);
    if (m) {
      const f = m[1];
      map.set(f, (map.get(f) || 0) + 1);
    }
  }
  
  const arr = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log("TOP ERROR FILES:");
  for (const [f, c] of arr) {
    console.log(c.toString().padStart(4, " "), f);
  }
  console.log("TOTAL FILES WITH ERRORS:", map.size);
}); 