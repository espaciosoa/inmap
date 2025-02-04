const express = require('express');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Define routes for all REST methods
app.get('/', (req, res) => {
  res.send('Received a GET request');
});

app.post('/', (req, res) => {
  console.log('POST Request Body:', req.body);
  res.send('Received a POST request');
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

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
