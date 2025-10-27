import { Router } from "express";

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    data: {
      portfolio: [],
      timestamp: new Date().toISOString()
    }
  });
});

export { router as portfolioRouter }; 