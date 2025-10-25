import { Decimal } from 'decimal.js';
import { Prisma } from '@prisma/client';

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 38,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -18,
  toExpPos: 18,
});

export type Money = Decimal;
export type TickSize = Decimal;

/**
 * Financial arithmetic utilities with Decimal precision
 * Prevents floating-point errors in price/quantity calculations
 */
export class MoneyUtils {
  /**
   * Create Money from string (recommended for API inputs)
   */
  static fromString(value: string): Money {
    return new Decimal(value);
  }

  /**
   * Create Money from number (use with caution - only for constants)
   */
  static fromNumber(value: number): Money {
    return new Decimal(value);
  }

  /**
   * Create Money from Prisma Decimal
   */
  static fromPrisma(value: Prisma.Decimal): Money {
    return new Decimal(value.toString());
  }

  /**
   * Convert Money to Prisma Decimal
   */
  static toPrisma(value: Money): Prisma.Decimal {
    return new Prisma.Decimal(value.toString());
  }

  /**
   * Safe multiplication: price * quantity
   */
  static multiply(price: Money, quantity: Money): Money {
    return price.mul(quantity);
  }

  /**
   * Safe division: amount / divisor
   */
  static divide(amount: Money, divisor: Money): Money {
    if (divisor.isZero()) {
      throw new Error('Division by zero');
    }
    return amount.div(divisor);
  }

  /**
   * Safe addition: amount1 + amount2
   */
  static add(amount1: Money, amount2: Money): Money {
    return amount1.add(amount2);
  }

  /**
   * Safe subtraction: amount1 - amount2
   */
  static subtract(amount1: Money, amount2: Money): Money {
    return amount1.sub(amount2);
  }

  /**
   * Align price to tick size (banker's rounding)
   */
  static alignToTick(price: Money, tickSize: TickSize): Money {
    if (tickSize.isZero()) {
      return price;
    }
    
    // Calculate how many ticks the price represents
    const ticks = price.div(tickSize);
    
    // Round to nearest tick
    const roundedTicks = ticks.round();
    
    // Convert back to price
    return roundedTicks.mul(tickSize);
  }

  /**
   * Round to specified decimal places (for display)
   */
  static roundToPlaces(amount: Money, places: number): Money {
    return amount.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculate percentage: amount * (percentage / 100)
   */
  static percentage(amount: Money, percentage: Money): Money {
    return amount.mul(percentage).div(100);
  }

  /**
   * Calculate percentage change: ((new - old) / old) * 100
   */
  static percentageChange(oldValue: Money, newValue: Money): Money {
    if (oldValue.isZero()) {
      throw new Error('Cannot calculate percentage change from zero');
    }
    return newValue.sub(oldValue).div(oldValue).mul(100);
  }

  /**
   * Calculate weighted average
   */
  static weightedAverage(
    values: Money[],
    weights: Money[]
  ): Money {
    if (values.length !== weights.length) {
      throw new Error('Values and weights arrays must have same length');
    }

    let totalWeight = MoneyUtils.fromString('0');
    let weightedSum = MoneyUtils.fromString('0');

    for (let i = 0; i < values.length; i++) {
      const weight = weights[i];
      const value = values[i];
      
      totalWeight = MoneyUtils.add(totalWeight, weight);
      weightedSum = MoneyUtils.add(weightedSum, MoneyUtils.multiply(value, weight));
    }

    if (totalWeight.isZero()) {
      throw new Error('Total weight cannot be zero');
    }

    return MoneyUtils.divide(weightedSum, totalWeight);
  }

  /**
   * Calculate simple moving average
   */
  static movingAverage(values: Money[], period: number): Money {
    if (values.length < period) {
      throw new Error('Not enough values for moving average');
    }

    const recentValues = values.slice(-period);
    const sum = recentValues.reduce((acc, val) => MoneyUtils.add(acc, val), MoneyUtils.fromString('0'));
    
    return MoneyUtils.divide(sum, MoneyUtils.fromNumber(period));
  }

  /**
   * Calculate position value: quantity * price
   */
  static positionValue(quantity: Money, price: Money): Money {
    return MoneyUtils.multiply(quantity, price);
  }

  /**
   * Calculate P&L: (currentPrice - entryPrice) * quantity
   */
  static profitLoss(entryPrice: Money, currentPrice: Money, quantity: Money): Money {
    const priceDiff = MoneyUtils.subtract(currentPrice, entryPrice);
    return MoneyUtils.multiply(priceDiff, quantity);
  }

  /**
   * Calculate P&L percentage: ((currentPrice - entryPrice) / entryPrice) * 100
   */
  static profitLossPercentage(entryPrice: Money, currentPrice: Money): Money {
    return MoneyUtils.percentageChange(entryPrice, currentPrice);
  }

  /**
   * Calculate commission: amount * commissionRate
   */
  static commission(amount: Money, commissionRate: Money): Money {
    return MoneyUtils.multiply(amount, commissionRate);
  }

  /**
   * Calculate net amount after commission: amount - commission
   */
  static netAmount(amount: Money, commissionRate: Money): Money {
    const commission = MoneyUtils.commission(amount, commissionRate);
    return MoneyUtils.subtract(amount, commission);
  }

  /**
   * Format for display (with thousand separators)
   */
  static formatForDisplay(amount: Money, decimalPlaces: number = 2): string {
    return amount.toFixed(decimalPlaces);
  }

  /**
   * Format for API (no thousand separators)
   */
  static formatForAPI(amount: Money, decimalPlaces: number = 18): string {
    return amount.toFixed(decimalPlaces);
  }

  /**
   * Compare two amounts (returns -1, 0, or 1)
   */
  static compare(amount1: Money, amount2: Money): number {
    return amount1.comparedTo(amount2);
  }

  /**
   * Check if amount is zero
   */
  static isZero(amount: Money): boolean {
    return amount.isZero();
  }

  /**
   * Check if amount is positive
   */
  static isPositive(amount: Money): boolean {
    return amount.isPositive();
  }

  /**
   * Check if amount is negative
   */
  static isNegative(amount: Money): boolean {
    return amount.isNegative();
  }

  /**
   * Get absolute value
   */
  static abs(amount: Money): Money {
    return amount.abs();
  }

  /**
   * Get minimum of two amounts
   */
  static min(amount1: Money, amount2: Money): Money {
    return Decimal.min(amount1, amount2);
  }

  /**
   * Get maximum of two amounts
   */
  static max(amount1: Money, amount2: Money): Money {
    return Decimal.max(amount1, amount2);
  }
}

/**
 * Common tick sizes for different markets
 */
export const TICK_SIZES = {
  // BIST stocks (0.01 TRY)
  BIST_STOCK: MoneyUtils.fromString('0.01'),
  
  // BIST futures (0.1 TRY)
  BIST_FUTURES: MoneyUtils.fromString('0.1'),
  
  // Crypto (0.01 USD)
  CRYPTO_USD: MoneyUtils.fromString('0.01'),
  
  // Forex (0.0001)
  FOREX: MoneyUtils.fromString('0.0001'),
} as const;

/**
 * Common commission rates
 */
export const COMMISSION_RATES = {
  // BIST stock commission (0.1%)
  BIST_STOCK: MoneyUtils.fromString('0.001'),
  
  // Crypto commission (0.25%)
  CRYPTO: MoneyUtils.fromString('0.0025'),
  
  // Forex commission (0.05%)
  FOREX: MoneyUtils.fromString('0.0005'),
} as const;
