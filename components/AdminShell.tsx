// components/AdminShell.tsx
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { ADMIN_COLORS, getPageMeta } from '@/lib/admin-utils';

import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const { admin, loading } = useAuth();
  const { title, subtitle } = getPageMeta(pathname);

  if (loading) {
    return (
      <div
        className="flex min-h-screen"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          background: ADMIN_COLORS.bgPrimary,
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `3px solid ${ADMIN_COLORS.purple500}`,
            borderTopColor: 'transparent',
          }}
        />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <>
      <div className="shell-root flex min-h-screen" style={{ background: ADMIN_COLORS.bgPrimary }}>
        <Sidebar />

        <div
          className="shell-main flex"
          style={{
            flex: 1,
            marginLeft: 240,
            minHeight: '100vh',
            flexDirection: 'column',
          }}
        >
          <TopNavbar title={title} subtitle={subtitle} />
          <main
            className="overflow-y-auto"
            style={{
              flex: 1,
              padding: 24,
            }}
          >
            {children}
          </main>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .shell-root {
            flex-direction: column;
          }

          .shell-main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
