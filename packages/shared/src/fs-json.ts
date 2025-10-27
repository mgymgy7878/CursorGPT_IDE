import fs from "node:fs/promises";
import path from "node:path";

export async function safeStat(filePath: string): Promise<{ size: number; mtime: Date } | null> {
  try {
    const stat = await fs.stat(filePath);
    return { size: stat.size, mtime: stat.mtime };
  } catch {
    return null;
  }
}

export async function readJSONFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJSONFile(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content);
}