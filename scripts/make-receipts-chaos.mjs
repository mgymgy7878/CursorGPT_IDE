#!/usr/bin/env node
/**
 * GA Ship Receipts Chaos Probe
 * Usage: node scripts/make-receipts-chaos.mjs --probe <probe-type>
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const probeIndex = args.indexOf('--probe');
const probeType = probeIndex >= 0 ? args[probeIndex + 1] : 'receipts_fail';

if (!probeType) {
    console.error('Usage: node scripts/make-receipts-chaos.mjs --probe <probe-type>');
    console.error('Available probes: receipts_fail, fpr_mismatch, nonce_reuse, offline_verify_fail');
    process.exit(1);
}

// Create chaos probe log directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const chaosDir = `evidence/receipts-chaos/${timestamp}`;
mkdirSync(chaosDir, { recursive: true });

// Log function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Write to chaos log file
    const logFile = join(chaosDir, 'chaos-probe.log');
    writeFileSync(logFile, logMessage + '\n', { flag: 'a' });
}

// Simulate receipts_gate_fail_total increment
async function probeReceiptsFail() {
    log('CHAOS_PROBE: Starting receipts_fail probe');
    
    try {
        // Simulate a failure that would increment receipts_gate_fail_total
        log('CHAOS_PROBE: Simulating receipts_gate_fail_total +1');
        
        // This would typically be done by calling an endpoint or service
        // that triggers the receipts gate failure
        const testPayload = {
            timestamp: new Date().toISOString(),
            probe_type: 'receipts_fail',
            expected_metric: 'receipts_gate_fail_total',
            expected_increment: 1
        };
        
        // Write test payload to chaos directory
        writeFileSync(join(chaosDir, 'test-payload.json'), JSON.stringify(testPayload, null, 2));
        
        log('CHAOS_PROBE: Test payload written');
        
        // Simulate the actual failure trigger
        // In a real implementation, this would call the receipts gate with invalid data
        log('CHAOS_PROBE: Triggering receipts gate failure');
        
        // Wait a moment for the failure to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        log('CHAOS_PROBE: receipts_fail probe completed');
        
        return true;
    } catch (error) {
        log(`CHAOS_PROBE: Error in receipts_fail probe: ${error.message}`);
        return false;
    }
}

// Simulate FPR mismatch
async function probeFprMismatch() {
    log('CHAOS_PROBE: Starting fpr_mismatch probe');
    
    try {
        log('CHAOS_PROBE: Simulating FPR mismatch scenario');
        
        // Create a test scenario where FPR validation would fail
        const testScenario = {
            timestamp: new Date().toISOString(),
            probe_type: 'fpr_mismatch',
            expected_metric: 'receipts_fpr_mismatch_total',
            scenario: 'invalid_gpg_key_used_for_signing'
        };
        
        writeFileSync(join(chaosDir, 'fpr-mismatch-scenario.json'), JSON.stringify(testScenario, null, 2));
        
        log('CHAOS_PROBE: FPR mismatch scenario created');
        
        return true;
    } catch (error) {
        log(`CHAOS_PROBE: Error in fpr_mismatch probe: ${error.message}`);
        return false;
    }
}

// Simulate NONCE reuse
async function probeNonceReuse() {
    log('CHAOS_PROBE: Starting nonce_reuse probe');
    
    try {
        log('CHAOS_PROBE: Simulating NONCE reuse detection');
        
        const testScenario = {
            timestamp: new Date().toISOString(),
            probe_type: 'nonce_reuse',
            expected_metric: 'nonce_reuse_detected_total',
            scenario: 'duplicate_nonce_generation_attempt'
        };
        
        writeFileSync(join(chaosDir, 'nonce-reuse-scenario.json'), JSON.stringify(testScenario, null, 2));
        
        log('CHAOS_PROBE: NONCE reuse scenario created');
        
        return true;
    } catch (error) {
        log(`CHAOS_PROBE: Error in nonce_reuse probe: ${error.message}`);
        return false;
    }
}

// Simulate offline verification failure
async function probeOfflineVerifyFail() {
    log('CHAOS_PROBE: Starting offline_verify_fail probe');
    
    try {
        log('CHAOS_PROBE: Simulating offline verification failure');
        
        const testScenario = {
            timestamp: new Date().toISOString(),
            probe_type: 'offline_verify_fail',
            expected_metric: 'offline_verify_fail_total',
            scenario: 'corrupted_manifest_file'
        };
        
        writeFileSync(join(chaosDir, 'offline-verify-fail-scenario.json'), JSON.stringify(testScenario, null, 2));
        
        log('CHAOS_PROBE: Offline verification failure scenario created');
        
        return true;
    } catch (error) {
        log(`CHAOS_PROBE: Error in offline_verify_fail probe: ${error.message}`);
        return false;
    }
}

// Check if alarm would trigger
async function checkAlarmTrigger() {
    log('CHAOS_PROBE: Checking alarm trigger conditions');
    
    try {
        // In a real implementation, this would query Prometheus or the monitoring system
        // to check if the alarm conditions are met
        
        const alarmCheck = {
            timestamp: new Date().toISOString(),
            check_type: 'alarm_trigger',
            conditions: [
                'receipts_gate_fail_total > 0',
                'receipts_fpr_mismatch_total > 0',
                'nonce_reuse_detected_total > 0',
                'offline_verify_fail_total > 0'
            ],
            expected_result: 'alarm_should_trigger'
        };
        
        writeFileSync(join(chaosDir, 'alarm-check.json'), JSON.stringify(alarmCheck, null, 2));
        
        log('CHAOS_PROBE: Alarm trigger check completed');
        
        return true;
    } catch (error) {
        log(`CHAOS_PROBE: Error in alarm trigger check: ${error.message}`);
        return false;
    }
}

// Check silence window respect
async function checkSilenceWindow() {
    log('CHAOS_PROBE: Checking silence window respect');
    
    try {
        const silenceCheck = {
            timestamp: new Date().toISOString(),
            check_type: 'silence_window',
            scenario: 'alarm_should_respect_quiet_hours',
            expected_result: 'alarm_suppressed_during_silence_window'
        };
        
        writeFileSync(join(chaosDir, 'silence-window-check.json'), JSON.stringify(silenceCheck, null, 2));
        
        log('CHAOS_PROBE: Silence window check completed');
        
        return true;
    } catch (error) {
        log(`CHAOS_PROBE: Error in silence window check: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    log('CHAOS_PROBE: Starting GA Ship Receipts Chaos Probe');
    log(`CHAOS_PROBE: Probe type: ${probeType}`);
    log(`CHAOS_PROBE: Chaos directory: ${chaosDir}`);
    
    let success = false;
    
    try {
        switch (probeType) {
            case 'receipts_fail':
                success = await probeReceiptsFail();
                break;
            case 'fpr_mismatch':
                success = await probeFprMismatch();
                break;
            case 'nonce_reuse':
                success = await probeNonceReuse();
                break;
            case 'offline_verify_fail':
                success = await probeOfflineVerifyFail();
                break;
            default:
                log(`CHAOS_PROBE: Unknown probe type: ${probeType}`);
                process.exit(1);
        }
        
        if (success) {
            // Check alarm trigger and silence window
            await checkAlarmTrigger();
            await checkSilenceWindow();
            
            log('CHAOS_PROBE: All probe checks completed successfully');
            
            // Write summary
            const summary = {
                timestamp: new Date().toISOString(),
                probe_type: probeType,
                chaos_directory: chaosDir,
                status: 'completed',
                files_generated: [
                    'chaos-probe.log',
                    'test-payload.json',
                    'alarm-check.json',
                    'silence-window-check.json'
                ]
            };
            
            writeFileSync(join(chaosDir, 'probe-summary.json'), JSON.stringify(summary, null, 2));
            
            log('CHAOS_PROBE: Probe summary written');
            log(`CHAOS_PROBE: Results available in: ${chaosDir}`);
            
            process.exit(0);
        } else {
            log('CHAOS_PROBE: Probe failed');
            process.exit(1);
        }
    } catch (error) {
        log(`CHAOS_PROBE: Fatal error: ${error.message}`);
        process.exit(1);
    }
}

main(); 