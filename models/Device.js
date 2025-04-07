const mongoose = require("mongoose");

const relaySchema = new mongoose.Schema({
  relayName: String,
  onCommand: String,
  offCommand: String,
  color: String,
  controlType: String,
  sliderMax: Number
});

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  relays: [relaySchema]
});

const Device = mongoose.model("Device", deviceSchema);
module.exports = Device;
