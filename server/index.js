import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes.js';
import dns from 'node:dns';
import fs from 'fs';
import { User, Category, Task } from './models.js';

if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => { req.body ??= {}; next(); });
app.use('/api', routes);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' }); });

async function seedIfNeeded() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Seeding initial data from database/*.json...');
    const { EJSON } = mongoose.mongo.BSON;
    const read = (name) => EJSON.parse(fs.readFileSync(new URL(`../database/${name}.json`, import.meta.url), 'utf8'));
    const db = mongoose.connection.db;
    for (const name of ['users', 'categories', 'tasks']) {
      const docs = read(name);
      await db.collection(name).deleteMany({});
      await db.collection(name).insertMany(docs);
      console.log(`${name}: ${docs.length} documents`);
    }
    await Promise.all([User.init(), Category.init(), Task.init()]);
    console.log('Database seeded successfully.');
  }
}

let mongoUri = process.env.MONGO_URI;

try {
  if (!mongoUri) {
    console.log('No MONGO_URI provided. Starting local MongoMemoryServer...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      instance: { port: 27017, dbName: 'taskdesk' }
    });
    mongoUri = mongod.getUri();
  }
  await mongoose.connect(mongoUri, { dbName: 'taskdesk' });
  console.log('MongoDB connected');
  await seedIfNeeded();
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => console.log('API running on http://localhost:' + port));
} catch (e) {
  console.error('Could not connect to MongoDB. Is it running, and is MONGO_URI in server/.env correct?\n', e.message);
  process.exit(1);
}
