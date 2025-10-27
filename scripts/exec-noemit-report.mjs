import { execSync } from "node:child_process";
import fs from "node:fs";

try {
  console.log("=== EXECUTOR TS ERROR REPORT ===\n");
  
  const result = execSync("pnpm -r --filter './services/executor' exec tsc --noEmit", { 
    encoding: "utf8", 
    cwd: process.cwd(),
    stdio: "pipe"
  });
  
  console.log("✅ EXECUTOR: No TypeScript errors found!");
  
} catch (error) {
  const output = error.stdout || error.stderr || "";
  const lines = output.split('\n');
  
  // Extract error lines
  const errors = lines.filter(line => 
    line.includes('error TS') && 
    line.includes('services/executor')
  );
  
  console.log(`❌ EXECUTOR: ${errors.length} TypeScript errors found\n`);
  
  // Group by file
  const errorsByFile = {};
  errors.forEach(error => {
    const match = error.match(/services\/executor\/src\/([^:]+)/);
    if (match) {
      const file = match[1];
      if (!errorsByFile[file]) errorsByFile[file] = [];
      errorsByFile[file].push(error.trim());
    }
  });
  
  // Top error files
  const topFiles = Object.entries(errorsByFile)
    .sort(([,a], [,b]) => b.length - a.length)
    .slice(0, 10);
    
  console.log("TOP ERROR FILES:");
  topFiles.forEach(([file, fileErrors]) => {
    console.log(`  ${file}: ${fileErrors.length} errors`);
  });
  
  console.log("\nSAMPLE ERRORS:");
  topFiles.slice(0, 3).forEach(([file, fileErrors]) => {
    console.log(`\n${file}:`);
    fileErrors.slice(0, 3).forEach(err => {
      const shortErr = err.substring(err.indexOf('error TS'));
      console.log(`  ${shortErr}`);
    });
  });
  
  process.exit(1);
} 