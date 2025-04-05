const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins or specify specific domain
app.use(cors({
  origin: ['https://esp-iot-ha.vercel.app', 'https://your-vercel-app.vercel.app'], // Add both your frontend domains here
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB', err));

// Device Schema
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true, required: true },
  relays: [{ relayId: Number, status: Boolean }]
});

const Device = mongoose.model('Device', deviceSchema);

// API to register device
app.post('/api/register', async (req, res) => {
  const { deviceId } = req.body;
  try {
    const device = new Device({ deviceId, relays: [] });
    await device.save();
    res.status(201).json({ message: 'Device registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering device' });
  }
});

// API to get relays for a device
app.get('/api/get-relays/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  try {
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.status(200).json({ relays: device.relays });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching relays' });
  }
});

// API to update relay status
app.post('/api/update-relay', async (req, res) => {
  const { deviceId, relayId, status } = req.body;
  try {
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    const relay = device.relays.find(r => r.relayId === relayId);
    if (relay) {
      relay.status = status;
    } else {
      device.relays.push({ relayId, status });
    }
    await device.save();
    res.status(200).json({ message: 'Relay status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating relay' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
