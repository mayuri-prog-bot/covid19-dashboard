import express from "express";

import {
  getTotalStatistics,
  getWorldStatistics,
  getRegionStatistics,
  getProvinceStatistics,
  getCityStatistics,
  getTimeSeries,
} from "../controllers/statisticsController";

const router = express.Router();

router.get("/total", getTotalStatistics);
router.get("/statistics", getWorldStatistics);
router.get("/statistics/:region", getRegionStatistics);
router.get("/statistics/:region/:province", getProvinceStatistics);
router.get("/statistics/:region/:province/:city", getCityStatistics);
router.get("/timeSeries", getTimeSeries);

export default router;
