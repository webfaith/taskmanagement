import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50 text-slate-900">
      <h1 className="text-4xl font-bold mb-4">Smart Student Scheduler</h1>
      <p className="text-xl mb-8">AI-powered task management for students.</p>

      <div className="flex gap-4">
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Login
        </Link>
        <Link href="/register" className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition">
          Register
        </Link>
      </div>
    </main>
  );
}
