const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");

dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

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
