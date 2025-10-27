// import { DSLValidator } from "@spark/strategy-dsl"; // Will be implemented later

export interface StrategyConfig {
  name: string;
  description: string;
  symbol: string;
  timeframe: string;
  indicators: Record<string, any>;
  conditions: Record<string, any>;
  rules: {
    entry: any[];
    exit: any[];
  };
  risk: {
    riskPct: number;
    maxPos: number;
    maxDailyLoss: number;
    stopLoss?: number;
    takeProfit?: number;
  };
  metadata?: any;
}

export interface GeneratedStrategy {
  code: string;
  artifactId: string;
  metadata: {
    name: string;
    symbol: string;
    timeframe: string;
    indicators: string[];
    riskParams: any;
  };
}

export class StrategyCodeGenerator {
  // private validator: DSLValidator; // Will be implemented later

  constructor() {
    // this.validator = new DSLValidator(); // Will be implemented later
  }

  generate(dsl: any): GeneratedStrategy {
    // Validate DSL first
    // const validation = this.validator.validateStrategy(dsl); // Will be implemented later
    // if (!validation.valid) {
    //   throw new Error(`Invalid DSL: ${validation.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
    // }

    const config = dsl as StrategyConfig;
    const artifactId = this.generateArtifactId(config);
    
    const code = this.generateStrategyCode(config);
    
    return {
      code,
      artifactId,
      metadata: {
        name: config.name,
        symbol: config.symbol,
        timeframe: config.timeframe,
        indicators: Object.keys(config.indicators),
        riskParams: config.risk
      }
    };
  }

  private generateArtifactId(config: StrategyConfig): string {
    const timestamp = Date.now().toString(36);
    const nameHash = config.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `ART-${nameHash}-${timestamp}`;
  }

  private generateStrategyCode(config: StrategyConfig): string {
    const indicators = this.generateIndicators(config.indicators);
    const conditions = this.generateConditions(config.conditions);
    const rules = this.generateRules(config.rules);
    const risk = this.generateRiskManagement(config.risk);

    return `// Generated Strategy: ${config.name}
// Artifact ID: ${this.generateArtifactId(config)}
// Generated: ${new Date().toISOString()}

import { Strategy, Bar, Position, Order } from "@spark/trading-core";

export class ${this.toClassName(config.name)} implements Strategy {
  private state: {
    indicators: any;
    positions: Position[];
    lastBar?: Bar;
  };

  constructor() {
    this.state = {
      indicators: {},
      positions: []
    };
  }

  init(): void {
    // Initialize indicators
${indicators.init}
  }

  onBar(bar: Bar): Order[] {
    this.state.lastBar = bar;
    
    // Update indicators
${indicators.update}
    
    // Check conditions
${conditions}
    
    // Execute rules
${rules}
    
    return [];
  }

  onTick(tick: any): Order[] {
    // Real-time tick processing (if needed)
    return [];
  }

  getState(): any {
    return this.state;
  }

  // Risk management
${risk}
}`;
  }

  private generateIndicators(indicators: Record<string, any>): { init: string; update: string } {
    let initCode = '';
    let updateCode = '';

    for (const [name, config] of Object.entries(indicators)) {
      const varName = this.toVarName(name);
      
      if (name === 'sma') {
        initCode += `    this.state.indicators.${varName} = new SMA(${config.period}, '${config.source || 'close'}');\n`;
        updateCode += `    this.state.indicators.${varName}.update(bar);\n`;
      } else if (name === 'ema') {
        initCode += `    this.state.indicators.${varName} = new EMA(${config.period}, '${config.source || 'close'}');\n`;
        updateCode += `    this.state.indicators.${varName}.update(bar);\n`;
      } else if (name === 'rsi') {
        initCode += `    this.state.indicators.${varName} = new RSI(${config.period}, '${config.source || 'close'}');\n`;
        updateCode += `    this.state.indicators.${varName}.update(bar);\n`;
      } else if (name === 'atr') {
        initCode += `    this.state.indicators.${varName} = new ATR(${config.period});\n`;
        updateCode += `    this.state.indicators.${varName}.update(bar);\n`;
      }
    }

    return { init: initCode, update: updateCode };
  }

  private generateConditions(conditions: Record<string, any>): string {
    let code = '';
    
    for (const [name, condition] of Object.entries(conditions)) {
      const varName = this.toVarName(name);
      
      if (condition.type === 'cross_up') {
        code += `    const ${varName} = this.checkCrossUp('${condition.indicator1}', '${condition.indicator2}');\n`;
      } else if (condition.type === 'cross_down') {
        code += `    const ${varName} = this.checkCrossDown('${condition.indicator1}', '${condition.indicator2}');\n`;
      } else if (condition.type === 'rsi_oversold') {
        code += `    const ${varName} = this.state.indicators.rsi?.value < ${condition.value};\n`;
      } else if (condition.type === 'rsi_overbought') {
        code += `    const ${varName} = this.state.indicators.rsi?.value > ${condition.value};\n`;
      } else if (condition.type === 'price_above_sma') {
        code += `    const ${varName} = bar.close ${condition.operator} this.state.indicators.sma?.value;\n`;
      }
    }
    
    return code;
  }

  private generateRules(rules: any): string {
    let code = '';
    
    // Entry rules
    for (const rule of rules.entry) {
      const conditionVar = this.toVarName(rule.condition);
      code += `    if (${conditionVar}) {\n`;
      code += `      return [{\n`;
      code += `        symbol: '${rule.symbol || 'UNKNOWN'}',\n`;
      code += `        side: '${rule.action}',\n`;
      code += `        quantity: ${rule.quantity},\n`;
      code += `        type: '${rule.price}',\n`;
      code += `        timestamp: bar.timestamp\n`;
      code += `      }];\n`;
      code += `    }\n`;
    }
    
    // Exit rules
    for (const rule of rules.exit) {
      const conditionVar = this.toVarName(rule.condition);
      code += `    if (${conditionVar}) {\n`;
      code += `      // Close positions logic\n`;
      code += `      return this.closePositions('${rule.action}');\n`;
      code += `    }\n`;
    }
    
    return code;
  }

  private generateRiskManagement(risk: any): string {
    return `  private checkRiskLimits(): boolean {
    // Check daily loss limit
    const dailyPnL = this.calculateDailyPnL();
    if (dailyPnL < -${risk.maxDailyLoss}) {
      return false;
    }
    
    // Check position limit
    if (this.state.positions.length >= ${risk.maxPos}) {
      return false;
    }
    
    return true;
  }

  private calculateDailyPnL(): number {
    // Calculate daily P&L logic
    return 0;
  }

  private closePositions(action: string): Order[] {
    // Close positions logic
    return [];
  }

  private checkCrossUp(ind1: string, ind2: string): boolean {
    // Cross up logic
    return false;
  }

  private checkCrossDown(ind1: string, ind2: string): boolean {
    // Cross down logic
    return false;
  }`;
  }

  private toClassName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[a-z]/, c => c.toUpperCase());
  }

  private toVarName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }
} 