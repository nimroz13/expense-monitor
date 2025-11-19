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

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app'
  ],
  credentials: true
}));
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
      console.error('Email sending failed:', emailError.message);message // Add error message for debugging
      console.error('Full error:', emailError);
      res.json({ 
        message: 'Email service unavailable. Reset code (for testing)',atch (error) {
        resetToken, // Fallback for developmentReset request error:', error);
        email: user.email,ess reset request' });
        email: user.email,
        error: emailError.message // Add error message for debugging
      });
    }// Verify Reset Token
  } catch (error) {erify-reset-token', async (req, res) => {
    console.error('Reset request error:', error);
    res.status(500).json({ error: 'Failed to process reset request' });st { email, resetToken } = req.body;
  }
});    const user = await User.findOne({ 

// Verify Reset Tokenoken,
app.post('/api/auth/verify-reset-token', async (req, res) => {xpiry: { $gt: Date.now() }
  try {
    const { email, resetToken } = req.body;
    if (!user) {
    const user = await User.findOne({ .status(400).json({ error: 'Invalid or expired reset code' });
      email,
      resetToken,
      resetTokenExpiry: { $gt: Date.now() }    res.json({ message: 'Reset code verified' });
    });
.json({ error: 'Verification failed' });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }
// Reset Password
    res.json({ message: 'Reset code verified' });th/reset-password', async (req, res) => {
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });st { email, resetToken, newPassword } = req.body;
  }
});    const user = await User.findOne({ 

// Reset Passwordoken,
app.post('/api/auth/reset-password', async (req, res) => {xpiry: { $gt: Date.now() }
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!user) {
    const user = await User.findOne({ .status(400).json({ error: 'Invalid or expired reset code' });
      email,
      resetToken,
      resetTokenExpiry: { $gt: Date.now() }    const hashedPassword = await bcrypt.hash(newPassword, 10);
    });

    if (!user) {fined;
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }
    res.json({ message: 'Password reset successful' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;.json({ error: 'Password reset failed' });
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
// Protected Routes for Incomes
    res.json({ message: 'Password reset successful' });auth, async (req, res) => {
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });st user = await User.findById(req.userId);
  }c.month === req.params.month);
});

// Protected Routes for Incomes.json({ error: 'Failed to fetch incomes' });
app.get('/api/incomes/:month', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const incomes = user.incomes.filter(inc => inc.month === req.params.month);app.post('/api/incomes/:month', auth, async (req, res) => {
    res.json(incomes);
  } catch (error) {st user = await User.findById(req.userId);
    res.status(500).json({ error: 'Failed to fetch incomes' });arams.month };
  }
});
mes[user.incomes.length - 1]);
app.post('/api/incomes/:month', auth, async (req, res) => {
  try {.json({ error: 'Failed to add income' });
    const user = await User.findById(req.userId);
    const newIncome = { ...req.body, month: req.params.month };
    user.incomes.push(newIncome);
    await user.save();app.put('/api/incomes/:month/:id', auth, async (req, res) => {
    res.json(user.incomes[user.incomes.length - 1]);
  } catch (error) {st user = await User.findById(req.userId);
    res.status(500).json({ error: 'Failed to add income' });;
  }
});tatus(404).json({ error: 'Income not found' });

app.put('/api/incomes/:month/:id', auth, async (req, res) => {bject.assign(income, req.body);
  try {
    const user = await User.findById(req.userId);
    const income = user.incomes.id(req.params.id);
    if (!income) {.json({ error: 'Failed to update income' });
      return res.status(404).json({ error: 'Income not found' });
    }
    Object.assign(income, req.body);
    await user.save();app.delete('/api/incomes/:month/:id', auth, async (req, res) => {
    res.json(income);
  } catch (error) {st user = await User.findById(req.userId);
    res.status(500).json({ error: 'Failed to update income' });
  }
});: 'Deleted' });

app.delete('/api/incomes/:month/:id', auth, async (req, res) => {.json({ error: 'Failed to delete income' });
  try {
    const user = await User.findById(req.userId);
    user.incomes.pull(req.params.id);
    await user.save();// Protected Routes for Expenses
    res.json({ message: 'Deleted' });auth, async (req, res) => {
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete income' });st user = await User.findById(req.userId);
  }exp.month === req.params.month);
});

// Protected Routes for Expenses.json({ error: 'Failed to fetch expenses' });
app.get('/api/expenses/:month', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const expenses = user.expenses.filter(exp => exp.month === req.params.month);app.post('/api/expenses/:month', auth, async (req, res) => {
    res.json(expenses);
  } catch (error) {st user = await User.findById(req.userId);
    res.status(500).json({ error: 'Failed to fetch expenses' });params.month };
  }
});
nses[user.expenses.length - 1]);
app.post('/api/expenses/:month', auth, async (req, res) => {
  try {.json({ error: 'Failed to add expense' });
    const user = await User.findById(req.userId);
    const newExpense = { ...req.body, month: req.params.month };
    user.expenses.push(newExpense);
    await user.save();app.put('/api/expenses/:month/:id', auth, async (req, res) => {
    res.json(user.expenses[user.expenses.length - 1]);
  } catch (error) {st user = await User.findById(req.userId);
    res.status(500).json({ error: 'Failed to add expense' });d);
  }
});atus(404).json({ error: 'Expense not found' });

app.put('/api/expenses/:month/:id', auth, async (req, res) => {bject.assign(expense, req.body);
  try {
    const user = await User.findById(req.userId);
    const expense = user.expenses.id(req.params.id);
    if (!expense) {.json({ error: 'Failed to update expense' });
      return res.status(404).json({ error: 'Expense not found' });
    }
    Object.assign(expense, req.body);
    await user.save();app.delete('/api/expenses/:month/:id', auth, async (req, res) => {
    res.json(expense);
  } catch (error) {st user = await User.findById(req.userId);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});: 'Deleted' });

app.delete('/api/expenses/:month/:id', auth, async (req, res) => {.json({ error: 'Failed to delete expense' });
  try {
    const user = await User.findById(req.userId);
    user.expenses.pull(req.params.id);
    await user.save();// Export for Vercel serverless
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });Only listen if not in serverless environment
  }if (process.env.NODE_ENV !== 'production') {






});  console.log(`Server running on port ${PORT}`);app.listen(PORT, () => {});  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
