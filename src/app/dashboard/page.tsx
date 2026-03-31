'use client';

import Link from 'next/link';

export default function DashboardPage() {
  // TODO: fetch sessions from InterviewService via useInterviewStore
  const sessions: any[] = [];

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/interview"
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
        >
          + New Interview
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500">No interview sessions yet. Start one!</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s: any) => (
            <li key={s.sessionId} className="border rounded p-4">
              <Link href={`/interview/room/${s.roomId}`}>
                {s.topic} – {s.startedAt}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
