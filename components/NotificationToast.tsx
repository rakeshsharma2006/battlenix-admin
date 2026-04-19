// components/NotificationToast.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, X } from 'lucide-react';

import { ADMIN_COLORS } from '@/lib/admin-utils';

interface FlagResponse {
  pagination?: {
    total?: number;
  };
}

interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'error';
  time: Date;
}

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const lastFlagCount = useRef<number>(0);
  const timerIds = useRef<number[]>([]);

  useEffect(() => {
    const checkFlags = async () => {
      try {
        const response = await fetch('/api/proxy/admin/flags?limit=5', {
          credentials: 'include',
        });
        const data = await response.json() as FlagResponse;
        const total = data.pagination?.total ?? 0;

        if (lastFlagCount.current > 0 && total > lastFlagCount.current) {
          const difference = total - lastFlagCount.current;
          const notification: Notification = {
            id: Date.now().toString(),
            message: `${difference} new player${difference > 1 ? 's' : ''} flagged by anti-cheat!`,
            type: 'warning',
            time: new Date(),
          };

          setNotifications((currentNotifications) => [notification, ...currentNotifications.slice(0, 9)]);
          setUnreadCount((currentCount) => currentCount + 1);

          const timeoutId = window.setTimeout(() => {
            setNotifications((currentNotifications) => (
              currentNotifications.filter((currentNotification) => currentNotification.id !== notification.id)
            ));
          }, 5000);

          timerIds.current.push(timeoutId);
        }

        lastFlagCount.current = total;
      } catch {
        // Polling errors stay silent to avoid noisy repeated alerts.
      }
    };

    void checkFlags();
    const intervalId = window.setInterval(() => {
      void checkFlags();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
      timerIds.current.forEach((timerId) => window.clearTimeout(timerId));
      timerIds.current = [];
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setShowPanel((currentValue) => !currentValue);
          setUnreadCount(0);
        }}
        className="relative transition"
        style={{
          padding: 8,
          borderRadius: 12,
          background: ADMIN_COLORS.bgCard,
          border: `1px solid ${ADMIN_COLORS.border}`,
          cursor: 'pointer',
        }}
      >
        <Bell size={20} color={ADMIN_COLORS.textSecondary} />
        {unreadCount > 0 ? (
          <span
            className="flex"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              background: ADMIN_COLORS.error,
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {showPanel ? (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 48,
            width: 320,
            borderRadius: 16,
            boxShadow: '0 24px 50px rgba(0,0,0,0.35)',
            zIndex: 50,
            background: ADMIN_COLORS.bgCard,
            border: `1px solid ${ADMIN_COLORS.border}`,
          }}
        >
          <div
            className="flex"
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottom: `1px solid ${ADMIN_COLORS.border}`,
            }}
          >
            <h3 style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontWeight: 600, fontSize: 14 }}>
              Notifications
            </h3>
            <button
              type="button"
              onClick={() => setShowPanel(false)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <X size={16} color={ADMIN_COLORS.textSecondary} />
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 288 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, color: ADMIN_COLORS.textMuted }}>
                  No new notifications
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex"
                  style={{
                    padding: 16,
                    alignItems: 'flex-start',
                    gap: 12,
                    borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                  }}
                >
                  <div
                    className="flex"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: notification.type === 'warning'
                        ? 'rgba(245,158,11,0.1)'
                        : 'rgba(124,58,237,0.1)',
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      color={notification.type === 'warning' ? ADMIN_COLORS.warning : ADMIN_COLORS.purple600}
                    />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: ADMIN_COLORS.textPrimary }}>
                      {notification.message}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: ADMIN_COLORS.textMuted }}>
                      {notification.time.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
