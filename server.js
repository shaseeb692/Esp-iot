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
  origin: ['https://esp-iot-ha.vercel.app', 'http://127.0.0.1:5500'], // Allow your local server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB', err));

// Define the relay schema
const relaySchema = new mongoose.Schema({
  relayName: String,
  onCommand: String,
  offCommand: String,
  color: String,
  controlType: String,
  sliderMax: Number
});

// Define the device schema
const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  relays: [relaySchema]
});

const Device = mongoose.model('Device', deviceSchema);

// API to register device
app.post('/api/register', async (req, res) => {
  const { deviceId, relays } = req.body;

  try {
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(200).json({ message: 'Device already registered' });
    }

    const newDevice = new Device({
      deviceId,
      relays
    });

    await newDevice.save();
    res.status(201).json({ message: 'Device registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering device' });
  }
});

// API to get all registered devices
app.get('/api/get-all-devices', async (req, res) => {
  try {
    const devices = await Device.find(); // Fetch all devices from the database
    res.status(200).json({ devices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

// API to delete a device by its chipId
app.delete('/api/delete-device/:chipId', async (req, res) => {
  const { chipId } = req.params;

  try {
    const device = await Device.findOneAndDelete({ chipId }); // Find the device by chipId and delete it
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.status(200).json({ message: `Device ${chipId} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting device' });
  }
});

// Serve static files (your index.html is at the root)
app.use(express.static(path.join(__dirname)));

// Catch-all route to handle frontend (single-page app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));  // Ensure this is correct path to index.html
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Route to serve devices.html
app.get('/devices.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'devices.html'));
});