import fs from "node:fs/promises";

let tokenCache = "";

async function getToken(): Promise<string> {
  try {
    tokenCache = await fs.readFile(
      process.env.ADMIN_TOKEN_FILE || "runtime/admin_token.txt",
      "utf8"
    );
  } catch {
    // Token file doesn't exist or can't be read
  }
  return tokenCache.trim();
}

export function adminGuard() {
  return async (req: any, res: any, next: any) => {
    const t = (await getToken()) || "";
    const h = (req.headers["x-admin-token"] || "").toString();

    if (!t || h !== t) {
      console.log(`[ADMIN] Unauthorized access attempt from ${req.ip}`);
      return res.status(401).json({ error: "ADMIN_ONLY" });
    }

    console.log(`[ADMIN] Authorized access from ${req.ip}`);
    next();
  };
} 