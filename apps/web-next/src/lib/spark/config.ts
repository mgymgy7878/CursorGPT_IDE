// EXECUTOR_BASE: gerçek executor servisi adresi
export const EXECUTOR_BASE =
  process.env.NEXT_PUBLIC_EXECUTOR_URL?.replace(/\/+$/,"") || "http://127.0.0.1:4001";

/**
 * SparkMode - Platform çalışma modu
 *
 * - prod: Production modu - gerçek borsa bağlantıları, gerçek işlemler
 * - testnet: Binance Testnet modu - testnet API'leri, testnet anahtarları
 * - paper: Paper trading modu - simüle edilmiş işlemler, gerçek veri akışı
 */
export type SparkMode = "prod" | "testnet" | "paper";

/**
 * getSparkMode - Tek kaynak Spark mode utility
 *
 * Build sırasında SPARK_MODE env var set edilir (CI/CD'de).
 * UI ve API aynı değeri kullanır (NEXT_PUBLIC vs server env ayrımı yok).
 *
 * Fallback sırası:
 * 1. SPARK_MODE (tek kaynak - build-time set edilir, server-side)
 * 2. NEXT_PUBLIC_SPARK_MODE (client-side erişim için, build-time'da SPARK_MODE'den kopyalanır)
 * 3. NODE_ENV bazlı: development → testnet, production → prod
 */
export function getSparkMode(): SparkMode {
  // Tek kaynak: SPARK_MODE (build-time set edilir)
  // Server-side: process.env.SPARK_MODE
  // Client-side: process.env.NEXT_PUBLIC_SPARK_MODE (build-time'da kopyalanır)
  if (typeof window !== "undefined") {
    // Client-side: NEXT_PUBLIC_ prefix gerekli
    if (process.env.NEXT_PUBLIC_SPARK_MODE) {
      const mode = process.env.NEXT_PUBLIC_SPARK_MODE as SparkMode;
      if (mode === "prod" || mode === "testnet" || mode === "paper") {
        return mode;
      }
    }
  } else {
    // Server-side: SPARK_MODE direkt erişilebilir
    if (process.env.SPARK_MODE) {
      const mode = process.env.SPARK_MODE as SparkMode;
      if (mode === "prod" || mode === "testnet" || mode === "paper") {
        return mode;
      }
    }
    // Server-side fallback: NEXT_PUBLIC_ de kontrol et
    if (process.env.NEXT_PUBLIC_SPARK_MODE) {
      const mode = process.env.NEXT_PUBLIC_SPARK_MODE as SparkMode;
      if (mode === "prod" || mode === "testnet" || mode === "paper") {
        return mode;
      }
    }
  }

  // Fallback: NODE_ENV bazlı
  if (typeof window !== "undefined") {
    // Client-side: NODE_ENV genelde build-time'da sabit
    return "testnet"; // Development default
  } else {
    // Server-side: NODE_ENV kontrolü
    if (process.env.NODE_ENV === "production") {
      return "prod";
    }
    return "testnet"; // Development default
  }
}

/**
 * getExchangeNetwork - Exchange network bilgisi (Binance için)
 *
 * Binance için testnet/mainnet ayrımı yapar.
 * Diğer exchange'ler için null döner.
 */
export function getExchangeNetwork(): "testnet" | "mainnet" | null {
  const exchange = process.env.EXCHANGE || process.env.NEXT_PUBLIC_EXCHANGE;
  const binanceNetwork = process.env.BINANCE_NETWORK || process.env.NEXT_PUBLIC_BINANCE_NETWORK;

  if (exchange === "binance") {
    if (binanceNetwork === "testnet" || binanceNetwork === "mainnet") {
      return binanceNetwork;
    }
    // Fallback: Spark mode'a göre
    const mode = getSparkMode();
    return mode === "testnet" ? "testnet" : "mainnet";
  }

  return null;
}

/**
 * getBuildCommit - Tek kaynak build commit utility
 *
 * Build sırasında BUILD_COMMIT env var set edilir (CI/CD'de).
 * UI ve API aynı değeri kullanır (NEXT_PUBLIC vs server env ayrımı yok).
 *
 * Build-time'da BUILD_COMMIT set edilir, Next.js bunu NEXT_PUBLIC_BUILD_COMMIT'e
 * kopyalar (client-side erişim için). Utility function her ikisini de kontrol eder.
 *
 * Fallback sırası:
 * 1. BUILD_COMMIT (tek kaynak - build-time set edilir, server-side)
 * 2. NEXT_PUBLIC_BUILD_COMMIT (client-side erişim için, build-time'da BUILD_COMMIT'ten kopyalanır)
 * 3. GIT_SHA (7 karakter kısa hash)
 * 4. "dev" (development fallback)
 */
export function getBuildCommit(): string {
  // Tek kaynak: BUILD_COMMIT (build-time set edilir)
  // Server-side: process.env.BUILD_COMMIT
  // Client-side: process.env.NEXT_PUBLIC_BUILD_COMMIT (build-time'da kopyalanır)
  if (typeof window !== "undefined") {
    // Client-side: NEXT_PUBLIC_ prefix gerekli
    if (process.env.NEXT_PUBLIC_BUILD_COMMIT) {
      return process.env.NEXT_PUBLIC_BUILD_COMMIT;
    }
  } else {
    // Server-side: BUILD_COMMIT direkt erişilebilir
    if (process.env.BUILD_COMMIT) {
      return process.env.BUILD_COMMIT;
    }
    // Server-side fallback: NEXT_PUBLIC_ de kontrol et
    if (process.env.NEXT_PUBLIC_BUILD_COMMIT) {
      return process.env.NEXT_PUBLIC_BUILD_COMMIT;
    }
  }

  // Fallback: GIT_SHA (7 karakter)
  const gitSha = typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_GIT_SHA
    : process.env.GIT_SHA;
  if (gitSha) {
    return gitSha.slice(0, 7);
  }

  // Development fallback
  return "dev";
}
