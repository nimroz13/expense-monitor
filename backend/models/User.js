const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  amount: Number,
  category: String,
  currency: String,
  month: String,
  createdAt: { type: Date, default: Date.now }
});

const expenseSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  category: String,
  currency: String,
  month: String,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  incomes: [incomeSchema],
  expenses: [expenseSchema],
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
