import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    const revenue = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = revenue - expenses;
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    res.json({ revenue, expenses, profit, categoryTotals, transactionsCount: transactions.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to compute analytics', error: error.message });
  }
});

router.get('/monthly-trends', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    const monthly = {};

    for (const tx of transactions) {
      const month = new Date(tx.date).toLocaleString('default', { month: 'short' });
      monthly[month] = monthly[month] || { income: 0, expense: 0 };
      if (tx.type === 'income') monthly[month].income += tx.amount;
      else monthly[month].expense += tx.amount;
    }

    res.json(Object.entries(monthly).map(([month, values]) => ({ month, ...values })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to compute monthly trend', error: error.message });
  }
});

export default router;
