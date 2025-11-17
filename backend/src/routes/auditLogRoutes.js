const express = require("express");
const { getAuditLogs } = require("../controllers/auditLogController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.get("/", protect, authorize(["ADMIN"]), getAuditLogs);

module.exports = router;
