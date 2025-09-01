// pages/api/polls/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { question, options } = req.body as {
      question?: unknown;
      options?: unknown;
    };

    // Validate question
    if (typeof question !== 'string' || question.trim().length < 5 || question.length > 140) {
      return res.status(400).json({ error: 'Question must be 5–140 chars.' });
    }

    // Validate options (must be 2–6 items)
    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      return res.status(400).json({ error: 'Provide 2–6 options.' });
    }

    // Clean options -> array of non-empty strings (<= 60 chars)
    const clean = options
      .map((o: unknown) => (typeof o === 'string' ? o.trim() : ''))
      .filter((o) => o.length > 0 && o.length <= 60);

    if (clean.length < 2) {
      return res
        .status(400)
        .json({ error: 'Provide at least 2 valid options (each up to 60 chars).' });
    }

    // Create poll
    const poll = await prisma.poll.create({
      data: {
        question: question.trim(),
        options: {
          // turn ['Pizza','Burger'] into [{text:'Pizza'},{text:'Burger'}]
          create: clean.map((text) => ({ text })),
        },
      },
    });

    return res.status(200).json({ id: poll.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create poll.' });
  }
}