export interface PdfExportConfig {
    format: 'pdf';
    filename: string;
    data: any[];
    title: string;
    user: string;
    maxRecordsPerPage?: number;
}
export declare function writePdf(config: PdfExportConfig): Promise<{
    success: boolean;
    bytes: number;
    filename: string;
}>;
//# sourceMappingURL=pdfWriter.d.ts.map