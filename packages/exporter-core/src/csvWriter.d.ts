export interface ExportConfig {
    format: 'csv';
    filename: string;
    data: any[];
    columns: string[];
    user: string;
    chunkSize?: number;
}
export declare function writeCsv(config: ExportConfig): Promise<{
    success: boolean;
    bytes: number;
    filename: string;
}>;
//# sourceMappingURL=csvWriter.d.ts.map