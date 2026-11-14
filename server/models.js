import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true }));

export const Category = model('Category', new Schema({
  name: { type: String, required: true, unique: true },
}));

export const Task = model('Task', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['pending', 'inprogress', 'completed'], default: 'pending' },
  dueDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
  completedAt: Date,
}, { timestamps: true }));
