import { Request, Response, NextFunction } from "express";
import { piiValidator, sanitizeData } from "../../../runtime/schema/piiSchema";
import { dlpEngine, scanAndRedact } from "../../../runtime/dlp/regexPatterns";
import { dataEncryption, encryptSensitiveField } from "../../../runtime/crypto/encrypt";
import { Logger } from "../Logger";

export interface DataGuardConfig {
  enablePIIValidation: boolean;
  enableDLPScanning: boolean;
  enableEncryption: boolean;
  logViolations: boolean;
  blockOnViolation: boolean;
  redactInLogs: boolean;
}

export class DataGuardMiddleware {
  private logger = new Logger('DataGuard');
  private config: DataGuardConfig;

  constructor(config: Partial<DataGuardConfig> = {}) {
    this.config = {
      enablePIIValidation: true,
      enableDLPScanning: true,
      enableEncryption: false,
      logViolations: true,
      blockOnViolation: false,
      redactInLogs: true,
      ...config
    };
  }

  // PII Schema Validation Middleware
  validatePII(schemaType: 'userProfile' | 'tradingAccount' | 'transaction' | 'base') {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enablePIIValidation) {
        return next();
      }

      try {
        const validationResult = piiValidator.validate(schemaType, req.body);
        
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
          
          if (this.config.logViolations) {
            const sanitizedBody = this.config.redactInLogs ? sanitizeData(req.body) : req.body;
            this.logger.warn(`PII validation failed for ${schemaType}:`, {
              errors,
              body: sanitizedBody,
              ip: req.ip,
              userAgent: req.get('User-Agent')
            });
          }

          if (this.config.blockOnViolation) {
            return res.status(400).json({
              error: 'PII validation failed',
              details: errors
            });
          }
        }

        // Detect PII fields for logging
        const detectedFields = piiValidator.detectPIIFields(req.body);
        if (detectedFields.length > 0) {
          this.logger.info(`PII fields detected: ${detectedFields.join(', ')}`);
        }

        next();
      } catch (error) {
        this.logger.error(`PII validation error: ${error}`);
        next(error);
      }
    };
  }

  // DLP Scanning Middleware
  scanDLP() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableDLPScanning) {
        return next();
      }

      try {
        // Scan request body
        const bodyString = JSON.stringify(req.body);
        const dlpResult = dlpEngine.scanComplete(bodyString);

        if (dlpResult.detected) {
          if (this.config.logViolations) {
            this.logger.warn(`DLP violation detected:`, {
              patterns: dlpResult.patterns,
              riskScore: dlpResult.riskScore,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              redactedBody: dlpResult.redactedText
            });
          }

          if (this.config.blockOnViolation && dlpResult.riskScore > 5) {
            return res.status(400).json({
              error: 'Sensitive data detected in request',
              details: 'Request contains potentially sensitive information'
            });
          }

          // Replace body with redacted version for logging
          if (this.config.redactInLogs) {
            req.body = JSON.parse(dlpResult.redactedText);
          }
        }

        // Intercept response for scanning
        const originalSend = res.send;
        res.send = function(body: any) {
          if (typeof body === 'string') {
            const responseDlpResult = dlpEngine.scanComplete(body);
            if (responseDlpResult.detected) {
              if (this.config.logViolations) {
                this.logger.warn(`DLP violation in response:`, {
                  patterns: responseDlpResult.patterns,
                  riskScore: responseDlpResult.riskScore
                });
              }
              
              if (this.config.redactInLogs) {
                body = responseDlpResult.redactedText;
              }
            }
          }
          return originalSend.call(this, body);
        }.bind(this);

        next();
      } catch (error) {
        this.logger.error(`DLP scanning error: ${error}`);
        next(error);
      }
    };
  }

  // Encryption Middleware
  encryptSensitive() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableEncryption) {
        return next();
      }

      try {
        // Encrypt sensitive fields in request
        const encryptedBody = await this.encryptSensitiveFields(req.body);
        req.body = encryptedBody;

        next();
      } catch (error) {
        this.logger.error(`Encryption error: ${error}`);
        next(error);
      }
    };
  }

  private async encryptSensitiveFields(data: any): Promise<any> {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const encrypted = { ...data };
    const sensitiveFields = ['password', 'apiKey', 'secret', 'token', 'privateKey'];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        try {
          encrypted[key] = await encryptSensitiveField(value);
        } catch (error) {
          this.logger.warn(`Failed to encrypt field ${key}: ${error}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        encrypted[key] = await this.encryptSensitiveFields(value);
      }
    }

    return encrypted;
  }

  // Comprehensive Data Guard Middleware
  guard() {
    return [
      this.scanDLP(),
      this.encryptSensitive(),
      (req: Request, res: Response, next: NextFunction) => {
        // Log request metadata
        this.logger.info(`Request processed:`, {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          contentType: req.get('Content-Type'),
          bodySize: JSON.stringify(req.body).length
        });
        next();
      }
    ];
  }

  // Response Sanitization Middleware
  sanitizeResponse() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json;
      
      res.json = function(data: any) {
        if (this.config.redactInLogs) {
          const sanitizedData = sanitizeData(data);
          this.logger.info(`Response sent:`, {
            path: req.path,
            statusCode: res.statusCode,
            data: sanitizedData
          });
        }
        return originalJson.call(this, data);
      }.bind(this);

      next();
    };
  }

  // Rate Limiting for Data Operations
  rateLimitDataOps(maxRequests: number = 100, windowMs: number = 60000) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const window = requests.get(key);

      if (!window || now > window.resetTime) {
        requests.set(key, { count: 1, resetTime: now + windowMs });
      } else if (window.count >= maxRequests) {
        this.logger.warn(`Rate limit exceeded for ${key}`);
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((window.resetTime - now) / 1000)
        });
      } else {
        window.count++;
      }

      next();
    };
  }

  // Audit Trail Middleware
  auditTrail() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const originalEnd = res.end;

      res.end = function(chunk?: any, encoding?: any) {
        const duration = Date.now() - startTime;
        
        this.logger.info(`Request completed:`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return originalEnd.call(this, chunk, encoding);
      }.bind(this);

      next();
    };
  }

  // Configuration update
  updateConfig(newConfig: Partial<DataGuardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('DataGuard configuration updated:', this.config);
  }

  // Health check
  getStatus(): {
    config: DataGuardConfig;
    encryptionStatus: boolean;
    dlpStatus: boolean;
    piiStatus: boolean;
  } {
    return {
      config: this.config,
      encryptionStatus: this.config.enableEncryption,
      dlpStatus: this.config.enableDLPScanning,
      piiStatus: this.config.enablePIIValidation
    };
  }
}

// Pre-configured middleware instances
export const dataGuard = new DataGuardMiddleware();

// Specific middleware for different endpoints
export const userDataGuard = new DataGuardMiddleware({
  enablePIIValidation: true,
  enableDLPScanning: true,
  blockOnViolation: true
});

export const tradingDataGuard = new DataGuardMiddleware({
  enablePIIValidation: true,
  enableDLPScanning: true,
  enableEncryption: true,
  blockOnViolation: false
});

export const auditDataGuard = new DataGuardMiddleware({
  enablePIIValidation: false,
  enableDLPScanning: true,
  redactInLogs: true
});

// Utility functions
export const validateUserData = dataGuard.validatePII('userProfile');
export const validateTradingData = dataGuard.validatePII('tradingAccount');
export const validateTransactionData = dataGuard.validatePII('transaction');
export const scanForSensitiveData = dataGuard.scanDLP();
export const encryptSensitiveData = dataGuard.encryptSensitive();
export const comprehensiveGuard = dataGuard.guard();
export const sanitizeResponses = dataGuard.sanitizeResponse();
export const rateLimitData = dataGuard.rateLimitDataOps();
export const auditRequests = dataGuard.auditTrail(); 