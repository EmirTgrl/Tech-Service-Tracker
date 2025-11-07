const express = require("express");
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} = require("../controllers/customerController");
const { protect, authorize } = require("../middleware.js");

const router = express.Router();

router.use(protect, authorize(["ADMIN", "TECHNICIAN"]));

router.get("/", getAllCustomers);

router.post("/", createCustomer);

router.get("/:id", getCustomerById);

router.put("/:id", updateCustomer);

router.delete("/:id", authorize(["ADMIN"]), deactivateCustomer);

module.exports = router;
