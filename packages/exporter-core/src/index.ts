// Export@Scale + Observability Main Export (v1.7)
import { FastifyPluginAsync } from 'fastify';
import { exportRequestsTotal, exportConcurrentRunning, exportQueueDepth, exportFailTotal } from './metrics.js';
import { writeCsv, ExportConfig as CsvConfig } from './csvWriter.js';
import { writePdf, PdfExportConfig } from './pdfWriter.js';

export const exporterPlugin: FastifyPluginAsync = async (fastify) => {
  // Export run endpoint
  fastify.post('/export/run', async (request, reply) => {
    const { format, data, columns, title, user } = request.body as any;
    
    try {
      exportRequestsTotal.inc({ format, status: 'started', user });
      exportConcurrentRunning.inc();
      
      let result;
      
      if (format === 'csv') {
        const config: CsvConfig = {
          format: 'csv',
          filename: `export_${Date.now()}.csv`,
          data,
          columns,
          user
        };
        result = await writeCsv(config);
      } else if (format === 'pdf') {
        const config: PdfExportConfig = {
          format: 'pdf',
          filename: `export_${Date.now()}.pdf`,
          data,
          title: title || 'Export Report',
          user
        };
        result = await writePdf(config);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
      
      exportRequestsTotal.inc({ format, status: 'succeeded', user });
      exportConcurrentRunning.dec();
      
      return {
        success: true,
        result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      exportRequestsTotal.inc({ format, status: 'failed', user });
      exportFailTotal.inc({ reason: 'processing_error', format });
      exportConcurrentRunning.dec();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });
  
  // Export status endpoint
  fastify.get('/export/status', async (request, reply) => {
    return {
      status: 'ready',
      concurrentExports: exportConcurrentRunning.get(),
      queueDepth: exportQueueDepth.get(),
      timestamp: new Date().toISOString(),
      version: '1.7.0-export-scale'
    };
  });
  
  // Export metrics endpoint
  fastify.get('/export/metrics', async (request, reply) => {
    const { register } = await import('./metrics.js');
    return register.metrics();
  });
  
  // Export download endpoint (placeholder)
  fastify.get('/export/download/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    return {
      downloadUrl: `/export/files/${id}`,
      status: 'ready',
      timestamp: new Date().toISOString()
    };
  });
};

export default exporterPlugin;
