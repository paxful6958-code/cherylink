const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static files ---
app.use(express.static(path.join(__dirname, "public")));

// --- API routes ---
const payheroRoutes = require("./routes/payhero");
app.use("/api/payhero", payheroRoutes); // <- mounted so /api/payhero/stk-push works

// --- Serve homepage ---
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- 404 for unknown API routes (JSON, not HTML) ---
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// --- Global error handler (JSON, not HTML) ---
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});