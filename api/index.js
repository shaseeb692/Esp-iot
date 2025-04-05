const mongoose = require("mongoose");
let conn = null;

const uri = process.env.MONGODB_URI;

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  ledStatus: Boolean,
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
      device = new Device({ deviceId, ledStatus: false });
      await device.save();
    }
    return res.status(200).json({ ledStatus: device.ledStatus });
  }

  if (method === "POST" && url === "/update-led") {
    const { deviceId, ledStatus } = req.body;
    const device = await Device.findOneAndUpdate(
      { deviceId },
      { ledStatus },
      { new: true }
    );
    return res.status(200).json({ ledStatus: device.ledStatus });
  }

  if (method === "GET" && url.startsWith("/led-status")) {
    const deviceId = url.split("/")[2];
    const device = await Device.findOne({ deviceId });
    return res.status(200).json({ ledStatus: device ? device.ledStatus : false });
  }

  return res.status(404).json({ error: "Not Found" });
};
