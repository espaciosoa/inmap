const https = require('https');
const fs = require('fs');
const express = require('express');
const pathCerts = "/etc/letsencrypt/live/test.alreylz.me";
const PORT = 8443;

// Load SSL certificate and private key
const sslOptions = {

  key: fs.readFileSync(pathCerts+'/privkey.pem'),
  cert: fs.readFileSync(pathCerts+'/cert.pem'),
};

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Define routes for all REST methods
app.get('/', (req, res) => {
  res.send('Received a GET request');
});

app.post('/', (req, res) => {
  console.log('POST Request Body:', req.body);
  res.json(req.body);
});

app.put('/', (req, res) => {
  console.log('PUT Request Body:', req.body);
  res.send('Received a PUT request');
});

app.delete('/', (req, res) => {
  res.send('Received a DELETE request');
});

app.patch('/', (req, res) => {
  console.log('PATCH Request Body:', req.body);
  res.send('Received a PATCH request');
});

// Catch-all route for unsupported methods
app.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});

// Create the HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS server is running at https://localhost${PORT}`);
});

