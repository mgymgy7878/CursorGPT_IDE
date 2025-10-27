// PDF Writer for Export@Scale (v1.7)
// Memory-safe PDF writer with stream-based output and pagination
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { exportBytesTotal, exportLatencyMsBucket, exportMemoryBytes } from './metrics.js';
// Memory-safe PDF writer with streaming output
export async function writePdf(config) {
    const startTime = Date.now();
    const maxRecordsPerPage = config.maxRecordsPerPage || 50;
    try {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ bufferPages: true });
            const writeStream = createWriteStream(config.filename);
            let totalBytes = 0;
            // Track bytes written
            doc.on('data', (chunk) => {
                totalBytes += chunk.length;
            });
            doc.on('error', (error) => {
                reject(new Error(`PDF export failed: ${error.message}`));
            });
            writeStream.on('error', (error) => {
                reject(new Error(`PDF write failed: ${error.message}`));
            });
            writeStream.on('finish', () => {
                const endTime = Date.now();
                const latency = endTime - startTime;
                // Determine size category
                const sizeCategory = config.data.length < 1000 ? 'small' : config.data.length < 10000 ? 'medium' : 'large';
                // Record metrics
                exportLatencyMsBucket.observe({ format: config.format, size: sizeCategory }, latency);
                exportBytesTotal.inc({ format: config.format, status: 'success' }, totalBytes);
                resolve({
                    success: true,
                    bytes: totalBytes,
                    filename: config.filename
                });
            });
            // Pipe to file stream
            doc.pipe(writeStream);
            // Add header
            doc.fontSize(20).text(config.title, 50, 50);
            doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, 50, 80);
            doc.text(`User: ${config.user}`, 50, 95);
            doc.text(`Total Records: ${config.data.length}`, 50, 110);
            doc.moveDown(2);
            // Add data with pagination
            let y = 150;
            let recordsOnPage = 0;
            const lineHeight = 12;
            const pageHeight = 700;
            config.data.forEach((row, index) => {
                // Check if need new page
                if (y > pageHeight || recordsOnPage >= maxRecordsPerPage) {
                    doc.addPage();
                    y = 50;
                    recordsOnPage = 0;
                }
                // Format row data (limit length for readability)
                const rowText = JSON.stringify(row);
                const displayText = rowText.length > 100 ? rowText.substring(0, 100) + '...' : rowText;
                doc.fontSize(8).text(`${index + 1}. ${displayText}`, 50, y, { width: 500 });
                y += lineHeight;
                recordsOnPage++;
                // Track memory periodically (every 100 records)
                if (index % 100 === 0) {
                    const memUsed = process.memoryUsage().heapUsed;
                    exportMemoryBytes.set({ format: config.format }, memUsed);
                }
            });
            // Finalize PDF
            doc.end();
        });
    }
    catch (error) {
        const endTime = Date.now();
        const latency = endTime - startTime;
        exportLatencyMsBucket.observe({ format: config.format, size: 'large' }, latency);
        exportBytesTotal.inc({ format: config.format, status: 'error' }, 0);
        throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Summary: Stream-based PDF writer with pagination (50 records/page), memory tracking, file streaming
//# sourceMappingURL=pdfWriter.js.map