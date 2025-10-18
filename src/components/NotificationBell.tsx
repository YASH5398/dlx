import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

function timeAgo(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(d / 365);
  return `${y}y ago`;
}

function TypeIcon({ type }: { type: string }) {
  const common = 'h-5 w-5';
  switch (type) {
    case 'order':
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      );
    case 'wallet':
    case 'transaction':
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h18v10H3z" />
          <circle cx="17" cy="12" r="2" />
        </svg>
      );
    case 'mining':
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l9 5-9 5-9-5 9-5z" />
          <path d="M3 14l9 5 9-5" />
        </svg>
      );
    case 'referral':
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 14a4 4 0 10-8 0" />
          <circle cx="12" cy="7" r="3" />
        </svg>
      );
    case 'service':
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l7 7-7 7-7-7 7-7z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    default:
      return (
        <svg className={`${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, removeNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [lastOpen, setLastOpen] = useState<number>(Date.now());
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (open) setLastOpen(Date.now());
  }, [open]);

  const hasNewSinceOpen = notifications.some((n) => !n.read && n.createdAt > lastOpen);

  const handleClickItem = (id: string, route?: string) => {
    markAsRead(id);
    if (route) navigate(route);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        {/* Bell icon */}
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2z" />
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
            {unreadCount}
          </span>
        )}
        {hasNewSinceOpen && (
          <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-[#0a0e1f] border border-white/20 rounded-xl shadow-2xl z-50 animate-fade-in">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="text-sm font-semibold text-white">Notifications</div>
            <div className="text-xs text-gray-400">{notifications.length} total</div>
          </div>
          <ul className="divide-y divide-white/10">
            {notifications.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400">No notifications yet</li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClickItem(n.id, n.route)}
                    className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors ${
                      n.read ? 'hover:bg-white/5' : 'bg-white/[0.03] hover:bg-white/10'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 ${n.read ? 'bg-white/5' : 'bg-white/10 ring-1 ring-purple-500/50'}`}>
                      <TypeIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm leading-snug break-words ${n.read ? 'text-gray-200' : 'text-white font-semibold'}`}>{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                      aria-label="Dismiss notification"
                      className="ml-2 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}