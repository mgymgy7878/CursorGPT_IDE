import Ajv from "ajv";
import addFormats from "ajv-formats";
// import schema from "../dsl.schema.json"; // Will be implemented later

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class DSLValidator {
  private ajv: Ajv;
  private validate: any;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(this.ajv);
    // this.validate = this.ajv.compile(schema); // Will be implemented later
    this.validate = () => true; // Temporary mock
  }

  validateStrategy(strategy: any): ValidationResult {
    const valid = this.validate(strategy);
    
    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors: ValidationError[] = this.validate.errors?.map((error: any) => ({
      path: error.instancePath || '/',
      message: error.message || 'Unknown validation error',
      code: error.keyword || 'unknown'
    })) || [];

    return { valid: false, errors };
  }

  validateFromFile(filePath: string): Promise<ValidationResult> {
    return new Promise((resolve, reject) => {
      try {
        // const fs = require("fs"); // Will be implemented later
        // const strategy = JSON.parse(fs.readFileSync(filePath, 'utf8')); // Will be implemented later
        // resolve(this.validateStrategy(strategy)); // Will be implemented later
        resolve({ valid: true, errors: [] }); // Temporary mock
      } catch (error) {
        reject(error);
      }
    });
  }

  getSchema(): any {
    // return schema; // Will be implemented later
    return {}; // Temporary mock
  }

  getSupportedIndicators(): string[] {
    // return Object.keys(schema.properties?.indicators?.properties || {}); // Will be implemented later
    return ['sma', 'ema', 'rsi', 'macd']; // Temporary mock
  }

  getSupportedTimeframes(): string[] {
    // return schema.properties?.timeframe?.enum || []; // Will be implemented later
    return ['1m', '5m', '15m', '1h', '4h', '1d']; // Temporary mock
  }
} 