// components/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Sword,
  Swords,
  Users,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import { ADMIN_COLORS, getAdminDisplayName, getAdminInitial } from '@/lib/admin-utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [openTicketCount, setOpenTicketCount] = useState(0);

  useEffect(() => {
    if (admin) {
      fetch('/api/proxy/support/admin/stats')
        .then(res => res.json())
        .then(data => {
          if (data?.openCount) setOpenTicketCount(data.openCount);
        })
        .catch(() => {});
    }
  }, [admin]);

  const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/matches', label: 'Matches', icon: Swords },
    { href: '/slots', label: 'Slot Manager', icon: Clock },
    { href: '/payouts', label: 'Payouts', icon: CreditCard },
    { href: '/players', label: 'Players', icon: Users },
    { href: '/chat', label: 'Chats', icon: MessageSquare },
    { href: '/help-center', label: '🎧 Help Center', icon: MessageSquare, badge: openTicketCount },
  ];

  const displayName = getAdminDisplayName(admin);
  const roleLabel = admin?.role ?? 'admin';

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
    } catch {
      toast.error('Unable to logout right now.');
      setLoggingOut(false);
    }
  };

  return (
    <>
      <aside
        className="sidebar-shell flex"
        style={{
          width: 240,
          minHeight: '100vh',
          background: ADMIN_COLORS.bgSurface,
          borderRight: `1px solid ${ADMIN_COLORS.border}`,
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 30,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex" style={{ flexDirection: 'column', gap: 24, padding: 20 }}>
          <Link
            href="/dashboard"
            className="flex"
            style={{ alignItems: 'center', gap: 12, textDecoration: 'none' }}
          >
            <div
              className="flex"
              style={{
                width: 42,
                height: 42,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                boxShadow: '0 18px 40px rgba(124,58,237,0.28)',
              }}
            >
              <Sword size={18} color="#FFFFFF" />
            </div>
            <div className="flex" style={{ flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
                BattleNix
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: ADMIN_COLORS.textMuted,
                }}
              >
                Admin Console
              </span>
            </div>
          </Link>

          <nav className="flex" style={{ flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const { href, label, icon: Icon, badge } = item;
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  className="nav-link flex transition"
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 16px',
                    margin: '2px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: isActive ? ADMIN_COLORS.textPrimary : ADMIN_COLORS.textSecondary,
                    background: isActive ? ADMIN_COLORS.bgElevated : 'transparent',
                    borderLeft: isActive
                      ? `2px solid ${ADMIN_COLORS.purple600}`
                      : '2px solid transparent',
                  }}
                >
                  <div className="flex flex-1" style={{ alignItems: 'center', gap: 12 }}>
                    <Icon size={18} color={isActive ? ADMIN_COLORS.purple400 : ADMIN_COLORS.textSecondary} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
                  </div>
                  {!!badge && badge > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div
          className="flex"
          style={{
            flexDirection: 'column',
            gap: 12,
            padding: 20,
            borderTop: `1px solid ${ADMIN_COLORS.border}`,
          }}
        >
          <div className="flex" style={{ alignItems: 'center', gap: 12 }}>
            <div
              className="flex"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {getAdminInitial(admin)}
            </div>
            <div className="flex" style={{ flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span
                style={{
                  color: ADMIN_COLORS.textPrimary,
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </span>
              <span
                style={{
                  color: ADMIN_COLORS.textSecondary,
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="logout-button flex transition cursor-pointer"
            style={{
              width: '100%',
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderRadius: 10,
              border: `1px solid ${ADMIN_COLORS.border}`,
              background: ADMIN_COLORS.bgCard,
              color: loggingOut ? ADMIN_COLORS.textMuted : ADMIN_COLORS.textSecondary,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loggingOut ? (
              <span
                className="animate-spin"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                }}
              />
            ) : (
              <LogOut size={16} />
            )}
            <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <style jsx>{`
        .nav-link:hover {
          background: #13131e !important;
          color: #f1f5f9 !important;
        }

        .nav-link:hover :global(svg) {
          color: #a78bfa !important;
        }

        .logout-button:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.08) !important;
          color: #ef4444 !important;
        }

        @media (max-width: 1024px) {
          .sidebar-shell {
            position: relative !important;
            width: 100% !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </>
  );
}
