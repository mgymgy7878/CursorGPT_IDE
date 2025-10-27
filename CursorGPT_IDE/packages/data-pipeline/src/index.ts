// Data Pipeline Package
export * from "./etl.js";
export * from "./normalize/index.js";
export * from "./sources/index.js";

export function createPipeline() {
  return { on(_e:string,_cb:Function){}, async start(){}, async stop(){} };
}

export const dataPipeline = {
  version: "0.1.0",
  description: "Data pipeline and ETL operations"
}; 

// Auto-generated barrel exports
// removed accidental absolute barrel entries
