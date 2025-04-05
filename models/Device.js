const mongoose = require('mongoose');

const relaySchema = new mongoose.Schema({
  relayId: Number,
  relayName: String,
  status: Boolean, // true for ON, false for OFF
});

const deviceSchema = new mongoose.Schema({
  chipId: { type: String, unique: true },
  deviceName: String,
  ip: String, // Store the device IP to send commands
  relays: [relaySchema],
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
