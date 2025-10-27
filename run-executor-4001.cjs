process.on("unhandledRejection", e => (console.error("[executor][UR]", e), process.exit(1)));
process.on("uncaughtException", e => (console.error("[executor][UE]", e), process.exit(1)));

process.env.PORT = "4001";                 // ← Node ekosisteminin varsayılanı
process.env.EXECUTOR_PORT = "4001";        // ← bizim öncelik
process.env.PORT_EXECUTOR = "4001";        // ← dokümanlarda geçen varyant
process.env.HOST = "127.0.0.1";
process.env.EXECUTOR_HOST = "127.0.0.1";
process.env.LOG_LEVEL = "debug";

console.log("[executor][BOOT_ENV]", {
  PORT: process.env.PORT,
  EXECUTOR_PORT: process.env.EXECUTOR_PORT,
  PORT_EXECUTOR: process.env.PORT_EXECUTOR,
  HOST: process.env.HOST
});

try {
  require("./CursorGPT_IDE/services/executor/dist/index.cjs"); // dist giriş
} catch (e) {
  console.error("[executor][REQUIRE_FAIL]", e);
  process.exit(1);
}
