import express from 'express';
import { OpenAI } from 'openai';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

router.post('/', async (req, res) => {
  try {
    const { data } = req.body;
    if (!openai) {
      return res.json({
        insight: 'OpenAI API key is not configured. Using heuristic insights instead.\n\n1. Reduce discretionary expenses by 10% this month.\n2. Focus on high-margin services to increase profit.\n3. Set a weekly savings target to improve cash flow.\n4. Watch seasonal demand to avoid inventory pressure.',
      });
    }

    const prompt = `Analyze the following business financial data and provide:
1. Cost-cutting recommendations
2. Profit maximization strategies
3. Future financial predictions
4. Key risks and opportunities

Data: ${JSON.stringify(data)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are a senior business finance analyst.' }, { role: 'user', content: prompt }],
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content || 'No insight generated.';
    res.json({ insight: content });
  } catch (error) {
    res.status(500).json({ message: 'AI insights failed', error: error.message });
  }
});

export default router;
