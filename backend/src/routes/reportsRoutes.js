const express = require("express");
const {
  getTechnicianPerformance,
  getMostRepairedBrands,
} = require("../controllers/reportsController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.use(protect, authorize(["ADMIN"]));

router.get("/technician-performance", getTechnicianPerformance);

router.get("/most-repaired-brands", getMostRepairedBrands);

module.exports = router;
