const express = require('express');
const braintreeFloor = require('./apis/braintree-floor');

const app = express();
const port = 3000;

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Routes
app.get('/api/floor', braintreeFloor);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
