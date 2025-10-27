import { EventEmitter } from "events";
import type { TradingSignal, SignalValidationResult } from "./types";
import { SignalPriority } from "./types";

export class SignalValidator extends EventEmitter {
  private validationRules: Map<string, (signal: TradingSignal) => Promise<boolean>>;
  private minConfidence: number = 0.6;
  private maxAgeMs: number = 30000; // 30 saniye

  constructor() {
    super();
    this.validationRules = new Map();
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // Temel validasyon kuralları
    this.addRule('basic_fields', this.validateBasicFields.bind(this));
    this.addRule('confidence_threshold', this.validateConfidence.bind(this));
    this.addRule('signal_age', this.validateSignalAge.bind(this));
    this.addRule('symbol_format', this.validateSymbolFormat.bind(this));
    this.addRule('action_validity', this.validateAction.bind(this));
  }

  addRule(name: string, rule: (signal: TradingSignal) => Promise<boolean>): void {
    this.validationRules.set(name, rule);
  }

  removeRule(name: string): boolean {
    return this.validationRules.delete(name);
  }

  async validate(signal: TradingSignal): Promise<boolean> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Tüm validasyon kurallarını çalıştır
      for (const [ruleName, rule] of this.validationRules) {
        try {
          const isValid = await rule(signal);
          if (!isValid) {
            errors.push(`Rule '${ruleName}' failed`);
          }
        } catch (error) {
          errors.push(`Rule '${ruleName}' error: ${(error as Error).message}`);
        }
      }

      // Confidence hesapla
      const confidence = this.calculateConfidence(signal, errors, warnings);

      const result: SignalValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        confidence
      };

      // Event emit
      if (result.isValid) {
        this.emit('signal:validated', signal);
      } else {
        this.emit('signal:rejected', signal, errors.join(', '));
      }

      // Log
      const duration = Date.now() - startTime;
      console.log(`🔍 Signal validation: ${signal.id} - ${result.isValid ? 'VALID' : 'INVALID'} (${duration}ms)`);
      
      if (errors.length > 0) {
        console.log(`❌ Validation errors: ${errors.join(', ')}`);
      }
      if (warnings.length > 0) {
        console.log(`⚠️ Validation warnings: ${warnings.join(', ')}`);
      }

      return result.isValid;
    } catch (error) {
      console.error('Signal validation error:', error);
      this.emit('signal:error', signal, error);
      return false;
    }
  }

  private async validateBasicFields(signal: TradingSignal): Promise<boolean> {
    return !!(
      signal.id &&
      signal.symbol &&
      signal.action &&
      signal.confidence !== undefined &&
      signal.reasoning &&
      signal.timestamp
    );
  }

  private async validateConfidence(signal: TradingSignal): Promise<boolean> {
    return signal.confidence >= this.minConfidence && signal.confidence <= 1;
  }

  private async validateSignalAge(signal: TradingSignal): Promise<boolean> {
    const age = Date.now() - signal.timestamp.getTime();
    return age <= this.maxAgeMs;
  }

  private async validateSymbolFormat(signal: TradingSignal): Promise<boolean> {
    // Basit symbol format kontrolü
    const validSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT'];
    return validSymbols.includes(signal.symbol) || /^[A-Z]{3,10}USDT$/.test(signal.symbol);
  }

  private async validateAction(signal: TradingSignal): Promise<boolean> {
    const validActions = ['buy', 'sell', 'hold', 'close'];
    return validActions.includes(signal.action);
  }

  private calculateConfidence(signal: TradingSignal, errors: string[], warnings: string[]): number {
    let confidence = signal.confidence;

    // Hata varsa confidence düşür
    if (errors.length > 0) {
      confidence *= 0.5;
    }

    // Uyarı varsa hafif düşür
    if (warnings.length > 0) {
      confidence *= 0.9;
    }

    // Priority'ye göre ayarla
    switch (signal.priority) {
      case SignalPriority.CRITICAL:
        confidence *= 1.2;
        break;
      case SignalPriority.HIGH:
        confidence *= 1.1;
        break;
      case SignalPriority.LOW:
        confidence *= 0.9;
        break;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  // Configuration methods
  setMinConfidence(confidence: number): void {
    this.minConfidence = Math.max(0, Math.min(1, confidence));
  }

  setMaxAgeMs(ageMs: number): void {
    this.maxAgeMs = Math.max(1000, ageMs);
  }

  getValidationRules(): string[] {
    return Array.from(this.validationRules.keys());
  }
} 