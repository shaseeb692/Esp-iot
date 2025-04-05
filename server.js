require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("DB Connection Error:", err));

const deviceSchema = new mongoose.Schema({
    deviceId: String,
    ledStatus: Boolean
});

const Device = mongoose.model("Device", deviceSchema);

// Register a new device
app.post("/register", async (req, res) => {
    const { deviceId } = req.body;
    let device = await Device.findOne({ deviceId });

    if (!device) {
        device = new Device({ deviceId, ledStatus: false });
        await device.save();
    }
    res.json({ success: true, ledStatus: device.ledStatus });
});

// Update LED status
app.post("/update-led", async (req, res) => {
    const { deviceId, ledStatus } = req.body;
    const device = await Device.findOneAndUpdate({ deviceId }, { ledStatus }, { new: true });
    res.json({ success: true, ledStatus: device.ledStatus });
});

// Get LED status
app.get("/led-status/:deviceId", async (req, res) => {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    res.json({ ledStatus: device ? device.ledStatus : false });
});

app.listen(5000, () => console.log("Server running on port 5000"));
