// Loads ../database/*.json into MongoDB (replaces existing data in those collections).

import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import { User, Category, Task } from './models.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { EJSON } = mongoose.mongo.BSON;
const read = (name) => EJSON.parse(fs.readFileSync(new URL(`../database/${name}.json`, import.meta.url), 'utf8'));

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
for (const name of ['users', 'categories', 'tasks']) {
  const docs = read(name);
  await db.collection(name).deleteMany({});
  await db.collection(name).insertMany(docs);
  console.log(`${name}: ${docs.length} documents`);
}
await Promise.all([User.init(), Category.init(), Task.init()]); // create indexes
await mongoose.disconnect();
console.log('Done.');
