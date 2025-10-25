-- Migration: Add partial unique index for Position strategyId handling
-- Date: 2024-10-24
-- Issue: Nullable strategyId allows multiple nulls in unique constraint
-- Solution: Partial unique index for non-null strategyId only

-- Drop existing unique constraint if exists
ALTER TABLE "Position" DROP CONSTRAINT IF EXISTS "Position_strategyId_symbol_exchange_key";

-- Create partial unique index for non-null strategyId
CREATE UNIQUE INDEX "uniq_pos_strategy" 
ON "Position"("strategyId", "symbol", "exchange") 
WHERE "strategyId" IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX "uniq_pos_strategy" IS 'Ensures unique position per strategy when strategyId is not null. Allows multiple positions without strategy.';

-- Verify the index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname = 'uniq_pos_strategy';
