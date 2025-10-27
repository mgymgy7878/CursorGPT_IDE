import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { beginReportSession, snapshot, finalize } from "../lib/reporting";

const DIR  = process.env.REPORTS_DIR || "runtime/reports";
export const reportRouter = Router();

reportRouter.post("/report/session", async (req,res,next)=>{
  try { const out = await beginReportSession(req.body?.id); res.json(out); }
  catch(e){ next(e); }
});

reportRouter.post("/report/snapshot", async (req,res,next)=>{
  try { const out = await snapshot(); res.json(out); }
  catch(e){ next(e); }
});

reportRouter.post("/report/finalize", async (req,res,next)=>{
  try { const out = await finalize(); res.json(out); }
  catch(e){ next(e); }
});

reportRouter.get("/report/latest", async (req,res,next)=>{
  try { const j = JSON.parse(await fs.readFile(path.join(DIR,"latest.json"),"utf8")); res.json(j); }
  catch(e){ res.status(404).json({error:"NO_REPORT"}); }
});

reportRouter.get("/report/list", async (req,res,next)=>{
  try {
    const items = (await fs.readdir(DIR, { withFileTypes: true }))
      .filter(d=>d.isDirectory()).map(d=>d.name);
    res.json({ items });
  } catch(e){ res.json({ items: [] }); }
});

reportRouter.get("/report/:id", async (req,res,next)=>{
  try { const j = JSON.parse(await fs.readFile(path.join(DIR, req.params.id, "report.json"),"utf8")); res.json(j); }
  catch(e){ res.status(404).json({error:"NOT_FOUND"}); }
}); 