import { Router } from "express";

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    data: {
      evidence: [],
      timestamp: new Date().toISOString()
    }
  });
});

export { router as evidenceRouter }; 