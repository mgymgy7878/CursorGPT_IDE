export * from "./exchange/binance/index.js";
export * from "./exchange/binance/RestClient.js";
export * from "./exchange/binance/UserStream.js";
export * from "./market/MarketStream.js";
export * from "./config/exchange.js";
export * from "./bus/EventBus.js";
export * from "./persist/PrismaRepo.js";
export * from "./types.js";
export { Executor } from "./Executor.js";

// Legacy ExecutionEngine for backward compatibility
export class ExecutionEngine {
  private eventBus: any;
  private repo: any;

  constructor() {
    this.eventBus = { emitExecution: () => {} };
    this.repo = { 
      saveExecution: () => Promise.resolve(),
      updateExecutionStatus: () => Promise.resolve(),
      getExecution: () => Promise.resolve(null),
      updateExecutionOrder: () => Promise.resolve()
    };
  }

  async startExecution(params: any): Promise<any> {
    const executionId = `exec_${Date.now()}`;
    
    return {
      executionId,
      status: 'arm',
      nextStep: 'confirm'
    };
  }

  async confirmExecution(executionId: string, approve: boolean): Promise<any> {
    if (!approve) {
      return { executionId, status: 'cancelled' };
    }

    return {
      executionId,
      status: 'live',
      orderId: `ord_${Date.now()}`,
      clientOrderId: `cli_${Date.now()}`
    };
  }

  getEventBus(): any {
    return this.eventBus;
  }

  getRepo(): any {
    return this.repo;
  }
} 

// Auto-generated barrel exports
// removed accidental absolute barrel entries
