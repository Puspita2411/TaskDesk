import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => { req.body ??= {}; next(); });
app.use('/api', routes);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' }); });

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 5000, () => console.log('API running on http://localhost:' + (process.env.PORT || 5000)));
} catch (e) {
  console.error('Could not connect to MongoDB. Is it running, and is MONGO_URI in server/.env correct?\n', e.message);
  process.exit(1);
}
