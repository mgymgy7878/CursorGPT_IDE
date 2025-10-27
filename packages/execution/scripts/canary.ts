#!/usr/bin/env tsx

import { Executor } from "../src/Executor";
import { ExecutionStartParams } from "../src/types";
import { copilotGuards } from "../../copilot/guards";

interface CanaryOptions {
  mode: 'testnet' | 'live';
  symbol: string;
  qty: number;
  side: 'BUY' | 'SELL';
  arm: boolean;
  confirm: boolean;
  execute: boolean;
  policyCheck: boolean;
}

async function runCanaryTest(options: CanaryOptions): Promise<void> {
  console.log('🚀 Spark Trading Canary Test Başlatılıyor...');
  console.log('Options:', options);

  try {
    // Initialize executor
    const executor = new Executor();
    await executor.initialize();

    console.log('✅ Executor başlatıldı');
    console.log(`📡 User Stream: ${executor.isUserStreamConnected() ? 'Bağlı' : 'Bağlantı Yok'}`);
    console.log(`📡 Market Stream: ${executor.isMarketStreamConnected() ? 'Bağlı' : 'Bağlantı Yok'}`);

    // Create execution parameters
    const params: ExecutionStartParams = {
      mode: options.mode,
      symbol: options.symbol,
      side: options.side,
      qty: options.qty,
      confirm: 'human'
    };

    // Policy check if enabled
    if (options.policyCheck) {
      console.log('🔒 Risk Policy kontrolü yapılıyor...');
      const validation = copilotGuards.validateParams({
        symbol: params.symbol,
        side: params.side,
        quantity: params.qty
      });

      if (!validation.isValid) {
        console.log('⚠️ Policy ihlalleri tespit edildi:');
        validation.violations.forEach(v => console.log(`  - ${v}`));
        
        console.log('🔧 Önerilen düzeltmeler:');
        validation.suggestions.forEach(s => {
          console.log(`  - ${s.field}: ${s.currentValue} → ${s.suggestedValue} (${s.reason})`);
        });

        if (validation.riskLevel === 'HIGH') {
          console.log('❌ Yüksek risk seviyesi - test durduruluyor');
          return;
        }
      } else {
        console.log('✅ Risk Policy kontrolü geçildi');
      }
    }

    // Start execution
    console.log('📋 Execution başlatılıyor...');
    const startResult = await executor.startExecution(params);
    console.log('📋 Execution başlatıldı:', startResult);

    if (!options.arm) {
      console.log('⏸️ Arm modu devre dışı - test tamamlandı');
      return;
    }

    // Confirm execution
    console.log('✅ Execution onaylanıyor...');
    const confirmResult = await executor.confirmExecution(
      startResult.executionId, 
      options.confirm, 
      options.execute
    );
    console.log('✅ Execution onaylandı:', confirmResult);

    if (!options.execute) {
      console.log('⏸️ Execute modu devre dışı - test tamamlandı');
      return;
    }

    // Wait for execution to complete
    console.log('⏳ Execution tamamlanması bekleniyor...');
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      // Check execution status
      const repo = executor.getRepo();
      const execution = await repo.getExecution(startResult.executionId);
      
      if (execution) {
        console.log(`📊 Execution durumu (${attempts}s): ${execution.status}`);
        
        if (execution.status === 'filled' || execution.status === 'cancelled' || execution.status === 'error') {
          console.log('✅ Execution tamamlandı:', execution);
          break;
        }
      }
    }

    if (attempts >= maxAttempts) {
      console.log('⏰ Timeout - Execution tamamlanamadı');
    }

    // Get final statistics
    const executions = await executor.getRepo().getAllExecutions();
    const trades = await executor.getRepo().getAllTrades();
    
    console.log('📊 Test Sonuçları:');
    console.log(`  - Toplam Execution: ${executions.length}`);
    console.log(`  - Toplam Trade: ${trades.length}`);
    console.log(`  - Son Execution: ${executions[executions.length - 1]?.status || 'N/A'}`);

    console.log('🎉 Canary test başarıyla tamamlandı!');

  } catch (error) {
    console.error('❌ Canary test hatası:', error);
    process.exit(1);
  } finally {
    // Cleanup
    const executor = new Executor();
    await executor.shutdown();
  }
}

// Parse command line arguments
function parseArgs(): CanaryOptions {
  const args = process.argv.slice(2);
  const options: CanaryOptions = {
    mode: 'testnet',
    symbol: 'BTCUSDT',
    qty: 0.00012,
    side: 'BUY',
    arm: false,
    confirm: false,
    execute: false,
    policyCheck: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
        options.mode = args[++i] as 'testnet' | 'live';
        break;
      case '--symbol':
        options.symbol = args[++i];
        break;
      case '--qty':
        options.qty = parseFloat(args[++i]);
        break;
      case '--side':
        options.side = args[++i] as 'BUY' | 'SELL';
        break;
      case '--arm':
        options.arm = true;
        break;
      case '--confirm':
        options.confirm = true;
        break;
      case '--execute':
        options.execute = true;
        break;
      case '--no-policy':
        options.policyCheck = false;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Spark Trading Canary Test

Usage: tsx canary.ts [options]

Options:
  --mode <testnet|live>     Test mode (default: testnet)
  --symbol <SYMBOL>         Trading symbol (default: BTCUSDT)
  --qty <QUANTITY>          Order quantity (default: 0.00012)
  --side <BUY|SELL>         Order side (default: BUY)
  --arm                     Enable arm mode
  --confirm                 Enable confirm mode
  --execute                 Enable execute mode (real order)
  --no-policy               Disable policy checking
  --help                    Show this help

Examples:
  # Basic test (no real orders)
  tsx canary.ts --mode testnet --symbol BTCUSDT --qty 0.00012

  # Full test with real order
  tsx canary.ts --mode testnet --symbol BTCUSDT --qty 0.00012 --arm --confirm --execute

  # Test with custom parameters
  tsx canary.ts --mode testnet --symbol ETHUSDT --qty 0.001 --side SELL --arm --confirm
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  runCanaryTest(options).catch(console.error);
} 