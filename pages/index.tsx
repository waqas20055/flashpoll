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

    // Build a safe payload: trim, drop empties
    const payload = {
      question: question.trim(),
      options: options.map((o) => o.trim()).filter(Boolean), // array of strings only
    };

    // Light client-side guard (server also validates)
    if (payload.question.length < 5 || payload.question.length > 140) {
      alert('Question must be 5–140 characters.');
      return;
    }
    if (payload.options.length < 2 || payload.options.length > 6) {
      alert('Please provide 2–6 non-empty options (each up to 60 chars).');
      return;
    }
    if (payload.options.some((o) => o.length > 60)) {
      alert('Each option must be 60 characters or fewer.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || 'Failed to create poll');

      // Go to the poll page
      router.push(`/p/${data.id}`);
    } catch (err: any) {
      alert(err?.message || 'Something went wrong creating the poll.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold mb-2">FlashPoll</h1>
      <p className="text-gray-500 mb-6">Create a poll, share the link, get instant votes.</p>

      {/* noValidate disables Safari’s built-in pattern/required popups */}
      <form onSubmit={submit} noValidate className="space-y-4">
        {/* Question */}
        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2 text-black"
            placeholder="What should we order for lunch?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={140}
          />
          <div className="text-xs text-gray-400 mt-1">{question.length}/140</div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Options</label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
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
                  aria-label={`Remove option ${i + 1}`}
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