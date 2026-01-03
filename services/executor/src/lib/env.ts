/**
 * Monorepo-safe environment variable loader
 * Checks multiple locations for .env file (executor dir, root, parent)
 */

import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Candidate paths (most specific first)
const envCandidates = [
  join(__dirname, "../../../.env"), // Root .env
  join(__dirname, "../../.env"), // Parent .env
  join(__dirname, "../.env"), // Executor .env
  join(process.cwd(), ".env"), // Current working dir
];

let envLoaded = false;

/**
 * Load environment variables from the first found .env file
 */
export async function loadEnv(): Promise<void> {
  if (envLoaded) return;

  // Try dotenv if available
  try {
    const dotenv = await import("dotenv");

    for (const envPath of envCandidates) {
      if (existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`✅ Loaded .env from: ${envPath}`);
        envLoaded = true;
        return;
      }
    }

    console.warn("⚠️ No .env file found in candidate paths:", envCandidates);
  } catch (error) {
    // dotenv not installed, use process.env only
    console.warn("⚠️ dotenv not available, using process.env only");
  }

  envLoaded = true;
}

// Auto-load on import (fire and forget in dev, ensures .env is loaded early)
if (process.env.NODE_ENV !== "production") {
  loadEnv().catch((err) => {
    console.error("Failed to load .env:", err);
  });
}

