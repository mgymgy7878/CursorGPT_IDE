import type { GuardrailPolicy, Order, GuardrailResult } from "./policy";
export declare function updatePolicy(policy: Partial<GuardrailPolicy>): void;
export declare function guardrailMw(order: Order): GuardrailResult;
export declare function recordLoss(amount: number): void;
export declare function recordPositionChange(delta: number): void;
export declare function tripCircuitBreaker(trigger: string): void;
export declare function untripCircuitBreaker(): void;
export declare function setDryRunMode(enabled: boolean): void;
export declare function getCircuitBreakerStatus(): {
    tripped: boolean;
    tripTime: string | null;
    dryRunMode: boolean;
};
//# sourceMappingURL=guardrails.d.ts.map