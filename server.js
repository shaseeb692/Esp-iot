const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://esp-iot-ha.vercel.app', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB', err));

// Schema Definitions
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

const Device = mongoose.model('Device', deviceSchema);

// API Routes
app.post('/api/register', async (req, res) => {
  const { deviceId, relays } = req.body;
  try {
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(200).json({ message: 'Device already registered' });
    }

    const newDevice = new Device({ deviceId, relays });
    await newDevice.save();
    res.status(201).json({ message: 'Device registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering device' });
  }
});

app.get('/api/get-all-devices', async (req, res) => {
  try {
    const devices = await Device.find();
    res.status(200).json({ devices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

app.delete('/api/delete-device/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  try {
    const device = await Device.findOneAndDelete({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.status(200).json({ message: `Device ${deviceId} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting device' });
  }
});

// 🔥 New Route: Serve dynamic page like /Id-test001.html
app.get('/Id-:deviceId.html', async (req, res) => {
  const { deviceId } = req.params;

  // Fetch device details from the database
  const device = await Device.findOne({ deviceId });
  if (!device) {
    return res.status(404).send('Device not found');
  }

  // Generate HTML dynamically
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Control ${deviceId}</title>
    </head>
    <body>
      <h1>Device Control: ${deviceId}</h1>
      <div id="controls"></div>
      <script>
        const deviceId = "${deviceId}";

        function sendCommand(cmd) {
          fetch('/api/send-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd, deviceId })
          })
          .then(res => res.json())
          .then(data => alert(data.message));
        }

        // Render control UI dynamically based on device data
        const container = document.getElementById("controls");
        ${device.relays.map((relay) => {
          if (relay.controlType === 'switch') {
            return `
              container.innerHTML += '<p>${relay.relayName}</p>' +
              '<button onclick="sendCommand(\'${relay.onCommand}\')">ON</button>' +
              '<button onclick="sendCommand(\'${relay.offCommand}\')">OFF</button><hr/>';
          } else if (relay.controlType === 'slider') {
            return `
              container.innerHTML += '<p>${relay.relayName}</p>' +
              '<input type="range" min="0" max="${relay.sliderMax}" onchange="sendCommand(this.value)" /><hr/>';
          }
        }).join('')}
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// Serve static files (like index.html, styles, scripts, etc.)
app.use(express.static(path.join(__dirname)));

// Short route for devices.html
app.get('/devices.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'devices.html'));
});
app.get('/devices', (req, res) => {
  res.sendFile(path.join(__dirname, 'devices.html'));
});

// Fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
