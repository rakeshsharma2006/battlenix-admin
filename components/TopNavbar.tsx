// components/TopNavbar.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { ADMIN_COLORS, getAdminDisplayName, getAdminInitial } from '@/lib/admin-utils';

import NotificationToast from './NotificationToast';

type TopNavbarProps = {
  title: string;
  subtitle?: string;
};

export default function TopNavbar({ title, subtitle }: TopNavbarProps) {
  const { admin } = useAuth();
  const displayName = getAdminDisplayName(admin);
  const roleLabel = admin?.role ?? 'admin';

  return (
    <header
      className="flex"
      style={{
        minHeight: 64,
        background: ADMIN_COLORS.bgSurface,
        borderBottom: `1px solid ${ADMIN_COLORS.border}`,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div className="flex" style={{ flexDirection: 'column', gap: 4 }}>
        <strong
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: ADMIN_COLORS.textPrimary,
          }}
        >
          {title}
        </strong>
        {subtitle ? (
          <span
            style={{
              fontSize: 13,
              color: ADMIN_COLORS.textSecondary,
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>

      <div className="flex" style={{ alignItems: 'center', gap: 12 }}>
        <NotificationToast />
        <div
          className="flex"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {getAdminInitial(admin)}
        </div>
        <div className="flex" style={{ alignItems: 'center', gap: 8 }}>
          <span style={{ color: ADMIN_COLORS.textPrimary, fontSize: 14, fontWeight: 600 }}>
            {displayName}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 10px',
              borderRadius: 9999,
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.24)',
              color: ADMIN_COLORS.purple400,
              textTransform: 'uppercase',
              fontSize: 11,
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            {roleLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
