const mongoose = require("mongoose");

let conn = null;
const uri = process.env.MONGODB_URI;

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  relays: [{
    relayId: String,
    status: Boolean
  }],
});

let Device;

async function connectDB() {
  if (conn == null) {
    conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    Device = mongoose.model("Device", deviceSchema);
  }
}

module.exports = async (req, res) => {
  await connectDB();

  const { method, url } = req;

  if (method === "POST" && url === "/register") {
    const { deviceId } = req.body;
    let device = await Device.findOne({ deviceId });
    if (!device) {
      device = new Device({ deviceId, relays: [] });
      await device.save();
    }
    res.status(200).json({ message: "Device registered", deviceId: device.deviceId });
  }

  else if (method === "POST" && url === "/update-relay") {
    const { deviceId, relayId, status } = req.body;
    const device = await Device.findOne({ deviceId });
    if (device) {
      const relay = device.relays.find(r => r.relayId === relayId);
      if (relay) {
        relay.status = status;
        await device.save();
      } else {
        device.relays.push({ relayId, status });
        await device.save();
      }
      res.status(200).json({ message: "Relay updated", relays: device.relays });
    } else {
      res.status(404).json({ error: "Device not found" });
    }
  }

  else if (method === "GET" && url.startsWith("/get-relays")) {
    const deviceId = url.split("/")[2];
    const device = await Device.findOne({ deviceId });
    if (device) {
      res.status(200).json({ relays: device.relays });
    } else {
      res.status(404).json({ error: "Device not found" });
    }
  }

  else {
    res.status(404).json({ error: "Not Found" });
  }
};
