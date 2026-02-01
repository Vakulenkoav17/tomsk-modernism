const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const { connectToDatabase } = require('./db/connection');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

if (process.env.STORAGE_DRIVER !== 'cloudinary') {
  console.error('STORAGE_DRIVER must be set to "cloudinary".');
  process.exit(1);
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Cloudinary credentials are missing.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectToDatabase();
    console.log(`Storage driver: ${process.env.STORAGE_DRIVER || 'local'}`);
    if (process.env.STORAGE_DRIVER === 'cloudinary') {
      console.log(`Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME || 'not set'}`);
    }
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
