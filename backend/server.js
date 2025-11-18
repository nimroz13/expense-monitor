const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const auth = require('./middleware/auth');
const { sendResetEmail } = require('./config/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

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

    // Generate reset token (6-digit code)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset code
    try {
      console.log('Attempting to send email to:', email);
      console.log('Email config:', { 
        user: process.env.EMAIL_USER, 
        hasPassword: !!process.env.EMAIL_PASS 
      });
      
      await sendResetEmail(email, resetToken);
      
      console.log('Email sent successfully!');
      res.json({ 
        message: 'Reset code sent to your email',
        email: user.email 
      });
    } catch (emailError) {
      // If email fails, still return the code for development
      console.error('Email sending failed:', emailError.message);
      console.error('Full error:', emailError);
      res.json({ 
        message: 'Email service unavailable. Reset code (for testing)',
        resetToken, // Fallback for development
        email: user.email,
        error: emailError.message // Add error message for debugging
      });
    }
  } catch (error) {
    console.error('Reset request error:', error);
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

// Protected Routes for Incomes
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

// Protected Routes for Expenses
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
