import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const { optionId } = req.body;

      if (!optionId) return res.status(400).json({ error: 'optionId required' });

      const option = await prisma.option.findUnique({ where: { id: optionId } });
      if (!option || option.pollId !== id) {
        return res.status(400).json({ error: 'Invalid option' });
      }

      // assign unique user ID via cookie
      let uid = req.cookies['uid'];
      if (!uid) {
        uid = crypto.randomUUID();
        res.setHeader('Set-Cookie', `uid=${uid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
      }

      await prisma.vote.upsert({
        where: { pollId_userId: { pollId: id as string, userId: uid } },
        update: { optionId },
        create: { pollId: id as string, optionId, userId: uid },
      });

      const poll = await prisma.poll.findUnique({
        where: { id: id as string },
        include: { options: { include: { _count: { select: { votes: true } } } } },
      });

      const total = poll?.options.reduce((s, o) => s + o._count.votes, 0) ?? 0;

      return res.status(200).json({
        ok: true,
        totalVotes: total,
        options: poll?.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })) ?? [],
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Vote failed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}