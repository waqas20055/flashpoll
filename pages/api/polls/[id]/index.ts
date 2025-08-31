import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { id } = req.query;

    const poll = await prisma.poll.findUnique({
      where: { id: id as string },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!poll) return res.status(404).json({ error: 'Not found' });

    const total = poll.options.reduce((sum, o) => sum + o._count.votes, 0);

    return res.status(200).json({
      id: poll.id,
      question: poll.question,
      totalVotes: total,
      options: poll.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
      createdAt: poll.createdAt,
    });
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}