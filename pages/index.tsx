import { useRouter } from 'next/router';
import { useState } from 'react';

export default function CreatePage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const canAdd = options.length < 6;

  const updateOption = (i: number, v: string) =>
    setOptions((ops) => ops.map((o, idx) => (idx === i ? v : o)));
  const addOption = () => setOptions((ops) => [...ops, '']);
  const removeOption = (i: number) =>
    setOptions((ops) => ops.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        question: question.trim(),
        options: options.map(o => o.trim()).filter(Boolean), // only non-empty strings
      };
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(`/p/${data.id}`);
    } catch (err: any) {
      alert(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold mb-2">FlashPoll</h1>
      <p className="text-gray-500 mb-6">
        Create a poll, share the link, get instant votes.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <input
            className="w-full rounded border px-3 py-2 text-black"
            placeholder="What should we order for lunch?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={140}
            required
          />
          <div className="text-xs text-gray-400 mt-1">
            {question.length}/140
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Options</label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 rounded border px-3 py-2 text-black"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                maxLength={60}
              />

              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="px-3 rounded border"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {canAdd && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm underline"
            >
              + Add option (max 6)
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black text-white py-3 font-medium disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create & Get Link'}
        </button>
      </form>
    </main>
  );
}