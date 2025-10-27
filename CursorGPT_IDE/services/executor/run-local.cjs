process.on("unhandledRejection", (e) => { console.error("[executor][UR]", e); process.exit(1); });
process.on("uncaughtException", (e) => { console.error("[executor][UE]", e); process.exit(1); });

process.env.EXECUTOR_HOST ||= "127.0.0.1";
process.env.EXECUTOR_PORT ||= "4001";
process.env.LOG_LEVEL ||= "debug";

console.log("[executor][BOOT]", {
  cwd: process.cwd(),
  node: process.version,
  host: process.env.EXECUTOR_HOST,
  port: process.env.EXECUTOR_PORT,
});

try {
  require("./services/executor/dist/index.cjs");
} catch (e) {
  console.error("[executor][REQUIRE_FAIL]", e);
  process.exit(1);
}
