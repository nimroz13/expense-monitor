const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, 'https://expenses-monitor.vercel.app', 'https://expenses-monitor-git-master-nimroz13.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection - Serverless-ready with connection caching
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenses-monitor', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    
    cachedDb = connection;
    console.log('✅ MongoDB Connected');
    return connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
};

// Initialize DB connection
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date,
  incomes: [{
    name: String,
    amount: Number,
    date: Date,
    month: String
  }],
  expenses: [{
    name: String,
    amount: Number,
    category: String,
    date: Date,
    month: String
  }]
});

const User = mongoose.model('User', userSchema);

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Email sending function
const sendResetEmail = async (email, resetToken) => {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Code',
    html: `
      <h2>Password Reset Request</h2>
      <p>Your reset code is: <strong>${resetToken}</strong></p>
      <p>This code will expire in 1 hour.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Password Reset Request
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account with that email exists' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    try {
      await sendResetEmail(email, resetToken);
      res.json({ message: 'Reset code sent to your email', email: user.email });
    } catch (emailError) {
      console.error('Email error:', emailError);
      res.json({ 
        resetToken, // Fallback for development
        email: user.email,
        message: 'Email service unavailable. Check console for reset code.'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process reset request' });
  }
});

// Verify Reset Token
app.post('/api/auth/verify-reset-token', async (req, res) => {
  try {
    const { email, resetToken } = req.body;

    const user = await User.findOne({ 
      email,
      resetToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    res.json({ message: 'Reset code verified' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    const user = await User.findOne({ 
      email,
      resetToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Income Routes
app.get('/api/incomes/:month', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const incomes = user.incomes.filter(inc => inc.month === req.params.month);
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

app.post('/api/incomes/:month', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const newIncome = { ...req.body, month: req.params.month };
    user.incomes.push(newIncome);
    await user.save();
    res.json(user.incomes[user.incomes.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add income' });
  }
});

app.put('/api/incomes/:month/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const income = user.incomes.id(req.params.id);
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }
    Object.assign(income, req.body);
    await user.save();
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update income' });
  }
});

app.delete('/api/incomes/:month/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.incomes.pull(req.params.id);
    await user.save();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

// Expense Routes
app.get('/api/expenses/:month', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const expenses = user.expenses.filter(exp => exp.month === req.params.month);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses/:month', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const newExpense = { ...req.body, month: req.params.month };
    user.expenses.push(newExpense);
    await user.save();
    res.json(user.expenses[user.expenses.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.put('/api/expenses/:month/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const expense = user.expenses.id(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    Object.assign(expense, req.body);
    await user.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:month/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.expenses.pull(req.params.id);
    await user.save();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Export for Vercel serverless
module.exports = app;

// Only listen if not in serverless environment
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  }).on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
}
