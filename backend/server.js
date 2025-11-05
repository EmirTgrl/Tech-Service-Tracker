const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const deviceRoutes = require("./src/routes/deviceRoutes");
const userRoutes = require("./src/routes/userRoutes");
const statsRoutes = require("./src/routes/statsRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");

dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/public/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check Endpoint
app.get("/api/status", (req, res) => {
  res.json({
    message: "Technical Service API is operational and ready!",
    environment: process.env.NODE_ENV || "development",
    serverTime: new Date().toISOString(),
  });
});

// Listen the Server
app.listen(PORT, () => {
  console.log(`\n🚀 The API Server is running at http://localhost:${PORT}...`);
});
