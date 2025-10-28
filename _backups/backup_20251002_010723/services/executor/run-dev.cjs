process.env.TS_NODE_TRANSPILE_ONLY = "1";
require("ts-node/register/transpile-only");
require("./src/index.ts");
