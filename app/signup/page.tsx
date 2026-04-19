'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignup = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Signup failed');
        return;
      }

      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0F] px-6">
      <div className="w-full max-w-md rounded-3xl border border-[#1E2035] bg-[#0F0F17] p-8 text-[#F1F5F9]">
        <h1 className="text-2xl font-bold tracking-tight">Create Admin User</h1>
        <p className="mt-2 text-sm text-[#94A3B8]">
          This creates an admin account in MongoDB and uses the same in-app auth system.
        </p>
        <div className="mt-6 space-y-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-[#1E2035] bg-[#13131E] px-4 py-3 outline-none"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-[#1E2035] bg-[#13131E] px-4 py-3 outline-none"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-[#1E2035] bg-[#13131E] px-4 py-3 outline-none"
          />
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-xl bg-[#7C3AED] px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
          {message ? <p className="text-sm text-[#EF4444]">{message}</p> : null}
        </div>
      </div>
    </main>
  );
}
