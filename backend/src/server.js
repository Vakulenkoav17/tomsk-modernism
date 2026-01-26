const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const { connectToDatabase } = require('./db/connection');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
