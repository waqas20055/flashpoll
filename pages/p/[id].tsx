import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

type PollData = {
  id: string;
  question: string;
  totalVotes: number;
  options: { id: string; text: string; votes: number }[];
};

export default function PollPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [data, setData] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const res = await fetch(`/api/polls/${id}`, { cache: 'no-store' as RequestCache });
    if (res.ok) setData(await res.json());
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const shareUrl = useMemo(
    () => (typeof window !== 'undefined' ? window.location.href : ''),
    []
  );

  const vote = async (optionId: string) => {
    if (!id) return;
    setVoting(optionId);
    try {
      const res = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Vote failed');
      setData((prev) =>
        prev ? { ...prev, totalVotes: json.totalVotes, options: json.options } : prev
      );
    } catch (e: any) {
      alert(e.message || 'Vote failed');
    } finally {
      setVoting(null);
    }
  };

  const share = async () => {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  try {
    if (navigator.share) {
      await navigator.share({ title: data?.question ?? 'FlashPoll', url });
      return;
    }
    throw new Error('Web Share not available');
  } catch {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch {
      window.prompt('Copy this link:', url);
    }
  }
};

  if (loading) return <main className="p-6">Loading…</main>;
  if (!data) return <main className="p-6">Poll not found.</main>;

  const total = Math.max(1, data.totalVotes);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold mb-2">{data.question}</h1>
      <p className="text-gray-500 mb-4">
        {data.totalVotes} vote{data.totalVotes === 1 ? '' : 's'}
      </p>

      <div className="space-y-3">
        {data.options.map((o) => {
          const pct = Math.round((o.votes / total) * 100);
          return (
            <button
              key={o.id}
              onClick={() => vote(o.id)}
              disabled={!!voting}
              className="w-full text-left border rounded p-3 hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex justify-between">
                <span className="font-medium">{o.text}</span>
                <span className="text-sm text-gray-500">{pct}%</span>
              </div>
              <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                <div
                  className="h-2 rounded"
                  style={{ width: `${pct}%`, backgroundColor: 'black' }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
  <button onClick={share} className="flex-1 rounded border py-2">
    Share
  </button>
  <button
    onClick={async () => {
      const url = window.location.href;
      try { 
        await navigator.clipboard.writeText(url);
        alert('Link copied!');
      } catch { 
        window.prompt('Copy this link:', url); 
      }
    }}
    className="flex-1 rounded border py-2"
  >
    Copy link
  </button>
  <a href="/" className="flex-1 text-center rounded bg-black text-white py-2">
    Make your own
  </a>
</div>
    </main>
  );
}