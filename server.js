const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins or specify a specific domain
app.use(cors({
  origin: ['https://esp-iot-ha.vercel.app'], // Frontend URL
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
  chipId: { type: String, unique: true, required: true },  // Use chipId instead of deviceId
  relays: [{ relayId: Number, relayName: String, status: Boolean }]  // Store relay details
});

const Device = mongoose.model('Device', deviceSchema);

// API to register device
app.post('/api/register', async (req, res) => {
  const { chipId } = req.body;

  try {
    // Check if the device already exists
    const existingDevice = await Device.findOne({ chipId });
    if (existingDevice) {
      return res.status(200).json({ message: 'Device already registered' });
    }

    // If not, register new device
    const device = new Device({ chipId, relays: [] });
    await device.save();
    res.status(201).json({ message: 'Device registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering device' });
  }
});

// API to add a relay to a device
app.post('/api/add-relay', async (req, res) => {
  const { chipId, relayName, relayId } = req.body;

  try {
    const device = await Device.findOne({ chipId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Add relay to the device's relays array
    const newRelay = { relayId, relayName, status: false };
    device.relays.push(newRelay);
    await device.save();

    res.status(200).json({ message: `Relay ${relayName} added to device ${chipId}` });
  } catch (error) {
    res.status(500).json({ message: 'Error adding relay' });
  }
});

// API to get relays for a device
app.get('/api/get-relays/:chipId', async (req, res) => {
  const { chipId } = req.params;

  try {
    const device = await Device.findOne({ chipId });
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
  const { chipId, relayId, status } = req.body;

  try {
    const device = await Device.findOne({ chipId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const relay = device.relays.find(r => r.relayId === relayId);
    if (relay) {
      relay.status = status;
    } else {
      device.relays.push({ relayId, relayName: `Relay ${relayId}`, status });
    }

    await device.save();
    res.status(200).json({ message: 'Relay status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating relay' });
  }
});

// API to send command to ESP device (like r1on, r1off)
app.post('/api/send-command', async (req, res) => {
  const { chipId, relayId, command } = req.body;

  try {
    const device = await Device.findOne({ chipId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const relay = device.relays.find(r => r.relayId === relayId);
    if (!relay) {
      return res.status(404).json({ message: `Relay ${relayId} not found` });
    }

    // Send the command to the ESP device
    // For now, we'll simulate the command being sent, assuming you have the device IP stored in DB.
    const commandResponse = await sendCommandToEsp(chipId, command, relayId);

    res.status(200).json({ message: `Command ${command} sent to device ${chipId}` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending command to ESP device' });
  }
});

// Simulate sending command to ESP device
async function sendCommandToEsp(chipId, command, relayId) {
  // Simulating communication, replace with actual logic to communicate with ESP device
  console.log(`Sending ${command} to ESP device with Chip ID: ${chipId} for Relay ${relayId}`);
  return true;
}

// Serve static files from the frontend (React or other)
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch-all route to handle frontend (single-page app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
