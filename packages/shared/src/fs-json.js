import fs from "node:fs/promises";
export async function safeStat(filePath) {
    try {
        const stat = await fs.stat(filePath);
        return { size: stat.size, mtime: stat.mtime };
    }
    catch {
        return null;
    }
}
export async function readJSONFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
export async function writeJSONFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
export async function writeTextFile(filePath, content) {
    await fs.writeFile(filePath, content);
}
