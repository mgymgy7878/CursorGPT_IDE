/* Minimal process.env typing for Next.js runtime */
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_TOKEN?: string;
    NODE_ENV?: "development" | "production" | "test";
  }
}
