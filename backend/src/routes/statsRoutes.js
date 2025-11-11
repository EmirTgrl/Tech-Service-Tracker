const express = require("express");
const {
  getDashboardStats,
  getFullDashboardData,
} = require("../controllers/statsController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  getDashboardStats
);

router.get(
  "/dashboard/full",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  getFullDashboardData
);

module.exports = router;
