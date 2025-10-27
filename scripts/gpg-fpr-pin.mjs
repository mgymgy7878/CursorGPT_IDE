#!/usr/bin/env node
/**
 * GPG FPR Pin Control
 * Usage: node scripts/gpg-fpr-pin.mjs <signature-file> <manifest-file> [--required-fpr <fingerprint>]
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const signatureFile = args[0];
const manifestFile = args[1];
const requiredFprIndex = args.indexOf('--required-fpr');
const requiredFpr = requiredFprIndex >= 0 ? args[requiredFprIndex + 1] : null;

if (!signatureFile || !manifestFile) {
    console.error('Usage: node scripts/gpg-fpr-pin.mjs <signature-file> <manifest-file> [--required-fpr <fingerprint>]');
    process.exit(1);
}

// Read required FPR from KEY_FINGERPRINTS.md if not provided
function getRequiredFPR() {
    if (requiredFpr) return requiredFpr;
    
    try {
        const keyFingerprints = readFileSync('docs/KEY_FINGERPRINTS.md', 'utf8');
        const match = keyFingerprints.match(/^FPR:\s*([A-F0-9]{40})/m);
        if (match) {
            return match[1];
        }
    } catch (error) {
        console.error('Error reading KEY_FINGERPRINTS.md:', error.message);
    }
    
    // Try environment variable
    const envFpr = process.env.RECEIPTS_REQUIRED_FPR;
    if (envFpr) return envFpr;
    
    console.error('No required FPR found. Provide --required-fpr or set RECEIPTS_REQUIRED_FPR env var.');
    process.exit(1);
}

// Verify GPG signature and extract FPR
function verifySignature(signatureFile, manifestFile) {
    return new Promise((resolve, reject) => {
        const gpg = spawn('gpg', [
            '--status-fd=1',
            '--verify',
            signatureFile,
            manifestFile
        ], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        gpg.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        gpg.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        gpg.on('close', (code) => {
            if (code === 0) {
                // Extract FPR from VALIDSIG line
                const validsigMatch = stdout.match(/\[GNUPG:\] VALIDSIG [A-F0-9]{40} ([A-F0-9]{40})/);
                if (validsigMatch) {
                    resolve(validsigMatch[1]);
                } else {
                    reject(new Error('No VALIDSIG line found in GPG output'));
                }
            } else {
                reject(new Error(`GPG verification failed with code ${code}: ${stderr}`));
            }
        });
        
        gpg.on('error', (error) => {
            reject(new Error(`Failed to spawn GPG: ${error.message}`));
        });
    });
}

// Main execution
async function main() {
    try {
        const requiredFPR = getRequiredFPR();
        console.log(`Required FPR: ${requiredFPR}`);
        
        const actualFPR = await verifySignature(signatureFile, manifestFile);
        console.log(`Actual FPR: ${actualFPR}`);
        
        if (actualFPR === requiredFPR) {
            console.log('✅ FPR match: Signature verified with pinned key');
            process.exit(0);
        } else {
            console.error('❌ FPR mismatch: Signature not from pinned key');
            console.error(`Expected: ${requiredFPR}`);
            console.error(`Actual:   ${actualFPR}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main(); 