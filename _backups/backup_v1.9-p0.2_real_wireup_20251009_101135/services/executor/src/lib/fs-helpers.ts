import fs from "node:fs/promises";
import path from "node:path";

export async function readJSONFile<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const txt = await fs.readFile(filePath, "utf8");
    return JSON.parse(txt) as T;
  } catch (err: any) {
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

export async function writeJSONFile(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function safeStat(p: string) {
  try { 
    return await fs.stat(p); 
  } catch (e: any) { 
    if (e?.code === "ENOENT") return null; 
    throw e; 
  }
} 