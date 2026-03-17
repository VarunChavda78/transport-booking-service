const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'Booking Service';

// Health check endpoint
// Jenkins and EKS use this to check if app is running
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

// Sample booking endpoint
app.get('/api/bookings', (req, res) => {
  res.status(200).json({
    message: 'Booking Service is running',
    bookings: []
  });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});