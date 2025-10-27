#!/usr/bin/env node
/**
 * GA Ship Manifest Generator
 * Usage: node scripts/make-manifest.mjs <NONCE> [--prev <prev-manifest>] [--out <output-file>]
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname;

// Parse command line arguments
const args = process.argv.slice(2);
const nonce = args[0];
const prevIndex = args.indexOf('--prev');
const outIndex = args.indexOf('--out');

if (!nonce) {
    console.error('Usage: node scripts/make-manifest.mjs <NONCE> [--prev <prev-manifest>] [--out <output-file>]');
    process.exit(1);
}

const prevManifest = prevIndex >= 0 ? args[prevIndex + 1] : null;
const outputFile = outIndex >= 0 ? args[outIndex + 1] : `evidence/receipts-smoke/${nonce}/sha256-manifest.json`;

// Validate NONCE format
const noncePattern = /^[0-9]{14}-[0-9a-f]{6}$/;
if (!noncePattern.test(nonce)) {
    console.error(`Invalid NONCE format: ${nonce}. Expected: YYYYMMDDHHmmss-6hex`);
    process.exit(1);
}

// Calculate SHA-256 hash of file content
function calculateSHA256(filePath) {
    const content = readFileSync(filePath);
    return createHash('sha256').update(content).digest('hex');
}

// Get file metadata
function getFileMetadata(filePath) {
    const stats = statSync(filePath);
    return {
        path: relative(process.cwd(), filePath).replace(/\\/g, '/'), // Normalize to forward slashes
        size: stats.size,
        full_sha256: calculateSHA256(filePath),
        mtime: stats.mtime.toISOString()
    };
}

// Get previous manifest SHA-256 if provided
function getPrevManifestSHA256(prevManifestPath) {
    if (!prevManifestPath) return null;
    
    try {
        const content = readFileSync(prevManifestPath, 'utf8');
        return createHash('sha256').update(content).digest('hex');
    } catch (error) {
        console.error(`Error reading previous manifest: ${error.message}`);
        process.exit(1);
    }
}

// Recursively find all files in a directory
function findFiles(dir, baseDir = dir) {
    const files = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(baseDir, fullPath);
        
        if (entry.isDirectory()) {
            files.push(...findFiles(fullPath, baseDir));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Generate manifest
function generateManifest() {
    const nonceDir = `evidence/receipts-smoke/${nonce}`;
    
    // Check if NONCE directory exists
    try {
        statSync(nonceDir);
    } catch (error) {
        console.error(`NONCE directory not found: ${nonceDir}`);
        process.exit(1);
    }
    
    // Find all files in NONCE directory
    const files = findFiles(nonceDir);
    
    // Sort files lexicographically for deterministic ordering
    files.sort();
    
    // Build artifacts object
    const artifacts = {};
    let totalSize = 0;
    
    for (const file of files) {
        const metadata = getFileMetadata(file);
        
        // Validate path starts with evidence/
        if (!metadata.path.startsWith('evidence/')) {
            console.error(`Invalid path (must start with evidence/): ${metadata.path}`);
            process.exit(1);
        }
        
        // Use relative path as artifact key
        const artifactKey = relative(nonceDir, file).replace(/\\/g, '/');
        artifacts[artifactKey] = metadata;
        totalSize += metadata.size;
    }
    
    // Get previous manifest SHA-256
    const prevManifestSHA256 = getPrevManifestSHA256(prevManifest);
    
    // Create manifest object (without self-hash initially)
    const manifest = {
        nonce,
        timestamp: new Date().toISOString(),
        artifacts,
        total_files: files.length,
        total_size: totalSize
    };
    
    // Add previous manifest SHA-256 if available
    if (prevManifestSHA256) {
        manifest.prev_manifest_sha256 = prevManifestSHA256;
    }
    
    // Calculate self-hash (two-pass method to avoid recursion)
    const manifestWithoutHash = JSON.stringify(manifest, null, 2);
    const manifestSHA256 = createHash('sha256').update(manifestWithoutHash).digest('hex');
    
    // Add self-hash
    manifest.manifest_sha256 = manifestSHA256;
    
    // Write manifest to file
    const finalManifest = JSON.stringify(manifest, null, 2);
    writeFileSync(outputFile, finalManifest, 'utf8');
    
    console.log(`Manifest generated: ${outputFile}`);
    console.log(`NONCE: ${nonce}`);
    console.log(`Total files: ${files.length}`);
    console.log(`Total size: ${totalSize} bytes`);
    console.log(`Manifest SHA-256: ${manifestSHA256}`);
    if (prevManifestSHA256) {
        console.log(`Previous manifest SHA-256: ${prevManifestSHA256}`);
    }
    
    return manifest;
}

// Main execution
try {
    generateManifest();
} catch (error) {
    console.error(`Error generating manifest: ${error.message}`);
    process.exit(1);
} 