export interface RiskPolicy {
  maxLeverage: number;
  maxQuantity: number;
  maxNotional: number;
  minStopLoss: number; // percentage
  maxStopLoss: number; // percentage
  minTakeProfit: number; // percentage
  maxTakeProfit: number; // percentage
  cooldownMinutes: number;
  allowedSymbols: string[];
  tradingHours: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

export interface StrategyParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategyCode?: string;
}

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  suggestions: ParamSuggestion[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ParamSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class CopilotGuards {
  private defaultPolicy: RiskPolicy = {
    maxLeverage: 10,
    maxQuantity: 1.0,
    maxNotional: 10000,
    minStopLoss: 1, // 1%
    maxStopLoss: 20, // 20%
    minTakeProfit: 2, // 2%
    maxTakeProfit: 50, // 50%
    cooldownMinutes: 5,
    allowedSymbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT'],
    tradingHours: {
      start: '00:00',
      end: '23:59'
    }
  };

  private customPolicies: Map<string, RiskPolicy> = new Map();

  constructor() {
    // Load custom policies from environment or config
    this.loadCustomPolicies();
  }

  private loadCustomPolicies(): void {
    // Example: Load from environment variables
    const customPolicyEnv = process.env.SPARK_CUSTOM_RISK_POLICY;
    if (customPolicyEnv) {
      try {
        const customPolicy = JSON.parse(customPolicyEnv);
        this.customPolicies.set('custom', customPolicy);
      } catch (error) {
        console.warn('Failed to parse custom risk policy:', error);
      }
    }
  }

  validateParams(params: StrategyParams, policyName: string = 'default'): ValidationResult {
    const policy = this.customPolicies.get(policyName) || this.defaultPolicy;
    const violations: string[] = [];
    const suggestions: ParamSuggestion[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Check symbol
    if (!policy.allowedSymbols.includes(params.symbol)) {
      violations.push(`Symbol ${params.symbol} is not in allowed list`);
      suggestions.push({
        field: 'symbol',
        currentValue: params.symbol,
        suggestedValue: policy.allowedSymbols[0],
        reason: 'Symbol not allowed in risk policy',
        priority: 'HIGH'
      });
      riskLevel = 'HIGH';
    }

    // Check quantity
    if (params.quantity > policy.maxQuantity) {
      violations.push(`Quantity ${params.quantity} exceeds maximum ${policy.maxQuantity}`);
      suggestions.push({
        field: 'quantity',
        currentValue: params.quantity,
        suggestedValue: policy.maxQuantity,
        reason: 'Quantity exceeds risk policy limit',
        priority: 'HIGH'
      });
      riskLevel = 'HIGH';
    }

    // Check leverage
    if (params.leverage && params.leverage > policy.maxLeverage) {
      violations.push(`Leverage ${params.leverage} exceeds maximum ${policy.maxLeverage}`);
      suggestions.push({
        field: 'leverage',
        currentValue: params.leverage,
        suggestedValue: policy.maxLeverage,
        reason: 'Leverage exceeds risk policy limit',
        priority: 'HIGH'
      });
      riskLevel = 'HIGH';
    }

    // Check stop loss
    if (params.stopLoss) {
      if (params.stopLoss < policy.minStopLoss) {
        violations.push(`Stop loss ${params.stopLoss}% is below minimum ${policy.minStopLoss}%`);
        suggestions.push({
          field: 'stopLoss',
          currentValue: params.stopLoss,
          suggestedValue: policy.minStopLoss,
          reason: 'Stop loss too tight, may trigger too early',
          priority: 'MEDIUM'
        });
        riskLevel = 'MEDIUM';
      } else if (params.stopLoss > policy.maxStopLoss) {
        violations.push(`Stop loss ${params.stopLoss}% exceeds maximum ${policy.maxStopLoss}%`);
        suggestions.push({
          field: 'stopLoss',
          currentValue: params.stopLoss,
          suggestedValue: policy.maxStopLoss,
          reason: 'Stop loss too wide, may cause large losses',
          priority: 'HIGH'
        });
        riskLevel = 'HIGH';
      }
    }

    // Check take profit
    if (params.takeProfit) {
      if (params.takeProfit < policy.minTakeProfit) {
        violations.push(`Take profit ${params.takeProfit}% is below minimum ${policy.minTakeProfit}%`);
        suggestions.push({
          field: 'takeProfit',
          currentValue: params.takeProfit,
          suggestedValue: policy.minTakeProfit,
          reason: 'Take profit too low, may not be worth the risk',
          priority: 'MEDIUM'
        });
        riskLevel = 'MEDIUM';
      } else if (params.takeProfit > policy.maxTakeProfit) {
        violations.push(`Take profit ${params.takeProfit}% exceeds maximum ${policy.maxTakeProfit}%`);
        suggestions.push({
          field: 'takeProfit',
          currentValue: params.takeProfit,
          suggestedValue: policy.maxTakeProfit,
          reason: 'Take profit too high, may be unrealistic',
          priority: 'MEDIUM'
        });
        riskLevel = 'MEDIUM';
      }
    }

    // Check trading hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime < policy.tradingHours.start || currentTime > policy.tradingHours.end) {
      violations.push(`Trading outside allowed hours (${policy.tradingHours.start}-${policy.tradingHours.end})`);
      suggestions.push({
        field: 'timing',
        currentValue: currentTime,
        suggestedValue: `Wait until ${policy.tradingHours.start}`,
        reason: 'Trading outside risk policy hours',
        priority: 'LOW'
      });
      riskLevel = 'MEDIUM';
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
      riskLevel
    };
  }

  suggestFix(params: StrategyParams, violations: string[]): StrategyParams {
    const policy = this.defaultPolicy;
    const fixedParams = { ...params };

    violations.forEach(violation => {
      if (violation.includes('Symbol')) {
        fixedParams.symbol = policy.allowedSymbols[0];
      } else if (violation.includes('Quantity')) {
        fixedParams.quantity = Math.min(params.quantity, policy.maxQuantity);
      } else if (violation.includes('Leverage')) {
        fixedParams.leverage = Math.min(params.leverage || 1, policy.maxLeverage);
      } else if (violation.includes('Stop loss')) {
        if (violation.includes('below minimum')) {
          fixedParams.stopLoss = policy.minStopLoss;
        } else if (violation.includes('exceeds maximum')) {
          fixedParams.stopLoss = policy.maxStopLoss;
        }
      } else if (violation.includes('Take profit')) {
        if (violation.includes('below minimum')) {
          fixedParams.takeProfit = policy.minTakeProfit;
        } else if (violation.includes('exceeds maximum')) {
          fixedParams.takeProfit = policy.maxTakeProfit;
        }
      }
    });

    return fixedParams;
  }

  enforcePolicy(params: StrategyParams, autoFix: boolean = false): { params: StrategyParams; enforced: boolean; reason?: string } {
    const validation = this.validateParams(params);
    
    if (validation.isValid) {
      return { params, enforced: false };
    }

    if (autoFix) {
      const fixedParams = this.suggestFix(params, validation.violations);
      return {
        params: fixedParams,
        enforced: true,
        reason: `Auto-fixed ${validation.violations.length} policy violations`
      };
    }

    // Reject the request
    return {
      params,
      enforced: false,
      reason: `Policy violations: ${validation.violations.join(', ')}`
    };
  }

  getPolicySummary(policyName: string = 'default'): RiskPolicy {
    return this.customPolicies.get(policyName) || this.defaultPolicy;
  }

  updatePolicy(policyName: string, policy: Partial<RiskPolicy>): void {
    const existingPolicy = this.customPolicies.get(policyName) || this.defaultPolicy;
    const updatedPolicy = { ...existingPolicy, ...policy };
    this.customPolicies.set(policyName, updatedPolicy);
    
    // Save to persistent storage (example)
    this.savePolicy(policyName, updatedPolicy);
  }

  private savePolicy(policyName: string, policy: RiskPolicy): void {
    // In a real implementation, save to database or file
    console.log(`Saving policy ${policyName}:`, policy);
  }

  // Advanced validation methods
  validateStrategyCode(strategyCode: string): ValidationResult {
    const violations: string[] = [];
    const suggestions: ParamSuggestion[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      /while\s*\(\s*true\s*\)/i,
      /for\s*\(\s*;\s*;\s*\)/i,
      /setInterval\s*\(\s*[^,]+,\s*0\s*\)/i,
      /setTimeout\s*\(\s*[^,]+,\s*0\s*\)/i
    ];

    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(strategyCode)) {
        violations.push(`Dangerous pattern detected: infinite loop risk`);
        suggestions.push({
          field: 'strategyCode',
          currentValue: 'Dangerous pattern',
          suggestedValue: 'Add proper exit conditions',
          reason: 'Infinite loop detected in strategy code',
          priority: 'HIGH'
        });
      }
    });

    // Check for excessive API calls
    const apiCallPatterns = [
      /fetch\s*\(/gi,
      /axios\s*\./gi,
      /\.get\s*\(/gi,
      /\.post\s*\(/gi
    ];

    const apiCallCount = apiCallPatterns.reduce((count, pattern) => {
      const matches = strategyCode.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    if (apiCallCount > 10) {
      violations.push(`Too many API calls detected: ${apiCallCount}`);
      suggestions.push({
        field: 'strategyCode',
        currentValue: `${apiCallCount} API calls`,
        suggestedValue: 'Reduce to < 10 API calls',
        reason: 'Excessive API calls may cause rate limiting',
        priority: 'MEDIUM'
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
      riskLevel: violations.length > 0 ? 'HIGH' : 'LOW'
    };
  }
}

// Export singleton instance
export const copilotGuards = new CopilotGuards(); 