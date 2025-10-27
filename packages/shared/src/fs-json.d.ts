export declare function safeStat(filePath: string): Promise<{
    size: number;
    mtime: Date;
} | null>;
export declare function readJSONFile<T>(filePath: string): Promise<T | null>;
export declare function writeJSONFile(filePath: string, data: unknown): Promise<void>;
export declare function writeTextFile(filePath: string, content: string): Promise<void>;
//# sourceMappingURL=fs-json.d.ts.map