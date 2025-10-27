#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * JSON dosyasını oku ve parse et
 */
export async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * JSON dosyasını yaz
 */
export async function writeJsonFile(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Nested object path'ine değer set et
 */
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * Nested object path'inden değer get et
 */
export function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * JSON dosyasına patch uygula
 */
export async function applyJsonPatch(filePath, patches, dryRun = false) {
  const data = await readJsonFile(filePath);
  const originalData = JSON.parse(JSON.stringify(data));
  
  for (const patch of patches) {
    if (patch.path === 'devDependencies.tsx') {
      // Special handling for adding tsx to devDependencies
      if (!data.devDependencies) {
        data.devDependencies = {};
      }
      data.devDependencies.tsx = patch.value;
    } else {
      setNestedValue(data, patch.path, patch.value);
    }
  }
  
  const newContent = JSON.stringify(data, null, 2);
  const originalContent = JSON.stringify(originalData, null, 2);
  
  if (dryRun) {
    return {
      success: true,
      changed: originalContent !== newContent,
      original: originalContent,
      patched: newContent
    };
  } else {
    await writeJsonFile(filePath, data);
    return {
      success: true,
      changed: originalContent !== newContent
    };
  }
}

/**
 * Metin dosyasına regex patch uygula
 */
export async function applyTextPatch(filePath, patches, dryRun = false) {
  const content = await fs.readFile(filePath, 'utf8');
  let newContent = content;
  
  for (const patch of patches) {
    if (patch.pattern.test(newContent)) {
      newContent = newContent.replace(patch.pattern, patch.replacement);
    }
  }
  
  if (dryRun) {
    return {
      success: true,
      changed: content !== newContent,
      original: content,
      patched: newContent
    };
  } else {
    await fs.writeFile(filePath, newContent, 'utf8');
    return {
      success: true,
      changed: content !== newContent
    };
  }
}

/**
 * Dosya varlığını kontrol et
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Dizin varlığını kontrol et
 */
export async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Dosya yolunu normalize et
 */
export function normalizePath(filePath) {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * Diff oluştur
 */
export function createDiff(original, patched, filePath) {
  const lines = [];
  lines.push(`📄 ${filePath}:`);
  lines.push('--- Original ---');
  lines.push(original);
  lines.push('\n--- Patched ---');
  lines.push(patched);
  lines.push('');
  return lines.join('\n');
}

/**
 * Patch sonuçlarını raporla
 */
export function reportPatchResults(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const changed = results.filter(r => r.success && r.changed);
  
  console.log('\n📊 PATCH SUMMARY:');
  console.log('==================');
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`🔄 Changed: ${changed.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed files:');
    failed.forEach(r => console.log(`  - ${r.file}: ${r.error}`));
  }
  
  if (changed.length > 0) {
    console.log('\n🔄 Changed files:');
    changed.forEach(r => console.log(`  - ${r.file}`));
  }
  
  return { successful, failed, changed };
} 