require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Device Schema
const deviceSchema = new mongoose.Schema({
    deviceId: String,
    status: Boolean,
});

const Device = mongoose.model("Device", deviceSchema);

// HTTP API
app.get("/", (req, res) => {
    res.send("ESP IoT Server is Running!");
});

app.post("/device", async (req, res) => {
    const { deviceId, status } = req.body;
    await Device.findOneAndUpdate({ deviceId }, { status }, { upsert: true });
    res.json({ success: true, message: "Device status updated" });
});

app.get("/device/:deviceId", async (req, res) => {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    res.json({ status: device ? device.status : false });
});

// WebSocket Server
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
    ws.on("message", async message => {
        const { deviceId, status } = JSON.parse(message);
        await Device.findOneAndUpdate({ deviceId }, { status }, { upsert: true });
        ws.send(JSON.stringify({ success: true }));
    });
});
