'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TOPICS = ['JavaScript', 'React', 'Node.js', 'System Design', 'Data Structures'];
const LANGUAGES = ['English', 'Vietnamese'];

export default function InterviewPage() {
  const router = useRouter();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: call interviewService.startInterview({ topic, language })
    // Then navigate to /interview/room/[roomId]
    const mockRoomId = crypto.randomUUID();
    router.push(`/interview/room/${mockRoomId}?language=${encodeURIComponent(language)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleStart} className="flex flex-col gap-4 w-96">
        <h1 className="text-2xl font-bold">Start Interview</h1>

        <label>
          <span className="block text-sm font-medium mb-1">Topic</span>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>

        <label>
          <span className="block text-sm font-medium mb-1">Language</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded py-2 font-semibold disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Start Interview'}
        </button>
      </form>
    </main>
  );
}
