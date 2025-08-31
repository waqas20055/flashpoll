import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { question, options } = req.body;

      if (typeof question !== 'string' || question.trim().length < 5 || question.length > 140) {
        return res.status(400).json({ error: 'Question must be 5–140 chars.' });
      }
      if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
        return res.status(400).json({ error: 'Provide 2–6 options.' });
      }

      const clean = options
        .map((o: unknown) => (typeof o === 'string' ? o.trim() : ''))
        .filter((o: string) => o.length > 0 && o.length <= 60);

      if (clean.length < 2) {
        return res.status(400).json({ error: 'Options must be non-empty (max 60 chars).' });
      }

      const poll = await prisma.poll.create({
        data: { question: question.trim(), options: { create: clean.map((text: string) => ({ text })) } },
      });

      return res.status(200).json({ id: poll.id });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to create poll.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}