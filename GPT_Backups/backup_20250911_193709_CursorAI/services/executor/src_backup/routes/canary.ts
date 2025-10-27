import { Router } from "express";

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

export { router as canaryRouter }; 