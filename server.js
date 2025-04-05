require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Device Schema & Model
const deviceSchema = new mongoose.Schema({
    deviceId: String,
    status: Boolean,
});

const Device = mongoose.model("Device", deviceSchema);

// Routes
app.get("/", (req, res) => {
    res.send("✅ ESP IoT Server is Running!");
});

app.post("/device", async (req, res) => {
    const { deviceId, status } = req.body;
    try {
        await Device.findOneAndUpdate({ deviceId }, { status }, { upsert: true });
        res.json({ success: true, message: "Device status updated" });
    } catch (err) {
        console.error("POST /device error:", err);
        res.status(500).json({ success: false, message: "Failed to update device status" });
    }
});

app.get("/device/:deviceId", async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });
        res.json({ status: device ? device.status : false });
    } catch (err) {
        console.error("GET /device error:", err);
        res.status(500).json({ status: false, message: "Error fetching device status" });
    }
});

// WebSocket Server
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
    console.log("📡 New WebSocket client connected");

    ws.on("message", async message => {
        try {
            console.log("📥 WebSocket received:", message);
            const { deviceId, status } = JSON.parse(message);
            await Device.findOneAndUpdate({ deviceId }, { status }, { upsert: true });
            ws.send(JSON.stringify({ success: true }));
        } catch (err) {
            console.error("WebSocket message error:", err);
            ws.send(JSON.stringify({ success: false, error: "Invalid message format or server error" }));
        }
    });

    ws.on("close", () => {
        console.log("❎ WebSocket client disconnected");
    });
});
