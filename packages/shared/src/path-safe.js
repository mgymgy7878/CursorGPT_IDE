import path from "path";
export function ensureWithin(baseDir, inputPath) {
    const base = path.resolve(baseDir);
    const target = path.resolve(base, inputPath);
    const rel = path.relative(base, target);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
        throw new Error("path_traversal_blocked");
    }
    return target;
}
