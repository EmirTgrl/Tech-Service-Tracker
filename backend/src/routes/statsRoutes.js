const express = require("express");
const { getDashboardStats } = require("../controllers/statsController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize(["ADMIN", "TECHNICIAN"]),
  getDashboardStats
);

module.exports = router;
