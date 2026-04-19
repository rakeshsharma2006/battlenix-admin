'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Sword,
  Trophy,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

const stats = [
  { value: '10K+', label: 'Players' },
  { value: '₹50L+', label: 'Distributed' },
  { value: '100%', label: 'Secure' },
];

const features = [
  { icon: Trophy, text: 'Real-time match management' },
  { icon: Shield, text: 'Anti-cheat monitoring and player bans' },
  { icon: Sword, text: 'Instant withdrawal approvals' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const { login } = useAuth();

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0F] text-[#F1F5F9]">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside
            className="relative hidden overflow-hidden border-r border-[#1E2035] lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12"
            style={{
              background:
                'linear-gradient(145deg, #0A0A0F 0%, #0F0F17 45%, #13131E 100%)',
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(124,58,237,0.15) 35%, transparent 72%)',
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                    boxShadow: '0 18px 40px rgba(124,58,237,0.28)',
                  }}
                >
                  <Sword className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-[#F1F5F9]">BattleNix</p>
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#475569]">
                    Admin Console
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 max-w-xl">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-[#A78BFA]">
                Tournament Operations
              </p>
              <h1 className="max-w-lg text-5xl font-bold tracking-tight text-[#F1F5F9] xl:text-6xl">
                Tournament
                <br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Control Center
                </span>
              </h1>
              <p className="mt-6 max-w-md text-base font-normal leading-7 text-[#94A3B8] xl:text-lg">
                Manage matches, monitor players, approve withdrawals, and keep every
                tournament workflow under control.
              </p>

              <div className="mt-10 space-y-4">
                {features.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border"
                      style={{
                        background: 'rgba(124,58,237,0.15)',
                        borderColor: 'rgba(124,58,237,0.28)',
                      }}
                    >
                      <Icon className="h-4 w-4 text-[#A78BFA]" />
                    </div>
                    <span className="text-sm font-normal text-[#94A3B8]">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#1E2035] bg-[#13131E]/90 p-4 text-center"
                >
                  <p className="text-2xl font-bold tracking-tight text-[#F59E0B]">{value}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-[#475569]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </aside>

          <main className="relative flex w-full items-center justify-center px-6 py-10 lg:w-1/2 lg:px-12">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-70 lg:hidden"
              style={{
                background:
                  'radial-gradient(circle at top, rgba(124,58,237,0.32), transparent 65%)',
              }}
            />

            <div className={`relative z-10 w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
              <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
                >
                  <Sword className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-[#F1F5F9]">BattleNix</p>
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#475569]">
                    Admin Console
                  </p>
                </div>
              </div>

              <div
                className="rounded-[28px] border border-[#1E2035] bg-[#0F0F17]/95 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur"
                style={{
                  boxShadow:
                    '0 24px 60px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
              >
                <div className="mb-8">
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#475569]">
                    Authorized Personnel Only
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#F1F5F9]">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm font-normal text-[#94A3B8]">
                    Sign in to your admin account to continue.
                  </p>
                </div>

                {error ? (
                  <div
                    className="mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      borderColor: 'rgba(239,68,68,0.24)',
                    }}
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
                    <p className="text-sm font-normal text-[#EF4444]">{error}</p>
                  </div>
                ) : null}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.28em] text-[#94A3B8]">
                      Email Address
                    </label>
                    <div className="field-shell rounded-2xl p-px">
                      <div className="field-inner relative rounded-[15px]">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="admin@battlenix.com"
                          autoComplete="email"
                          className="h-14 w-full bg-transparent pl-11 pr-4 text-sm font-normal text-[#F1F5F9] outline-none placeholder:text-[#475569]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-xs font-medium uppercase tracking-[0.28em] text-[#94A3B8]">
                        Password
                      </label>
                      <button
                        type="button"
                        className="text-xs font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="field-shell rounded-2xl p-px">
                      <div className="field-inner relative rounded-[15px]">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="h-14 w-full bg-transparent pl-11 pr-12 text-sm font-normal text-[#F1F5F9] outline-none placeholder:text-[#475569]"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] transition-colors hover:text-[#A78BFA]"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed"
                    style={{
                      background: loading
                        ? '#475569'
                        : 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
                      boxShadow: loading
                        ? 'none'
                        : '0 16px 36px rgba(124,58,237,0.35)',
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      'Sign In to Admin Panel'
                    )}
                  </button>
                </form>

                <div className="mt-8 border-t border-[#1E2035] pt-6">
                  <div className="flex items-center justify-center gap-2 text-center text-xs font-medium text-[#475569]">
                    <Shield className="h-4 w-4 text-[#10B981]" />
                    <span>Secured with HTTP-only cookies and JWT authentication</span>
                  </div>
                  <p className="mt-2 text-center text-xs font-normal text-[#475569]">
                    BattleNix Admin Console v1.0 | Authorized Personnel Only
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .field-shell {
          background: linear-gradient(135deg, #1e2035 0%, #1e2035 100%);
          transition: box-shadow 180ms ease, transform 180ms ease, background 180ms ease;
        }

        .field-shell:focus-within {
          background: linear-gradient(120deg, #7c3aed 0%, #8b5cf6 45%, #a78bfa 100%);
          background-size: 200% 200%;
          animation: border-pan 3s ease infinite;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
        }

        .field-inner {
          background: #13131e;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes border-pan {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-8px);
          }
          40% {
            transform: translateX(8px);
          }
          60% {
            transform: translateX(-6px);
          }
          80% {
            transform: translateX(6px);
          }
        }
      `}</style>
    </>
  );
}
