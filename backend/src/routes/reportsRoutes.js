const express = require("express");
const {
  getTechnicianPerformance,
  getMostRepairedBrands,
  getMonthlyIncome,
} = require("../controllers/reportsController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.use(protect, authorize(["ADMIN"]));

router.get("/technician-performance", getTechnicianPerformance);

router.get("/most-repaired-brands", getMostRepairedBrands);

router.get("/monthly-income", getMonthlyIncome);

module.exports = router;
