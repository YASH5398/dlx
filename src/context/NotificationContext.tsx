import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ref, onValue, set, update, off, DataSnapshot } from 'firebase/database';
import { db } from '../firebase.ts';
import { useUser } from './UserContext';

export type NotificationType =
  | 'transaction'
  | 'order'
  | 'wallet'
  | 'mining'
  | 'referral'
  | 'service'
  | 'info'
  | 'warning'
  | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: number; // epoch ms
  read: boolean;
  route?: string;
  meta?: Record<string, any>;
};

export type NotificationInput = Omit<Notification, 'id' | 'createdAt' | 'read'> & {
  createdAt?: number;
  read?: boolean;
};

type Ctx = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: NotificationInput, persistToDb?: boolean) => Promise<Notification>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clear: () => Promise<void>;
};

const NotificationContext = createContext<Ctx | undefined>(undefined);

function formatRouteForType(type: NotificationType, meta?: Record<string, any>): string | undefined {
  switch (type) {
    case 'order':
      return '/orders';
    case 'wallet':
    case 'transaction':
      return '/wallet';
    case 'mining':
      return '/mining';
    case 'referral':
      return '/referrals';
    case 'service':
      return '/services';
    default:
      return undefined;
  }
}

function useLocalReadMap(uid?: string | null) {
  const key = uid ? `dlx-notif-read-${uid}` : undefined;
  const [map, setMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!key) {
      setMap({});
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      if (raw) setMap(JSON.parse(raw));
      else setMap({});
    } catch {
      setMap({});
    }
  }, [key]);

  const persist = (next: Record<string, boolean>) => {
    setMap(next);
    if (key) {
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    }
  };

  return { map, persist } as const;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const uid = user?.id ?? null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { map: readMap, persist: persistReadMap } = useLocalReadMap(uid);
  const unsubRef = useRef<(() => void) | null>(null);

  // Subscribe to Firebase RTDB: notifications/users/{uid}
  useEffect(() => {
    // clear existing
    if (unsubRef.current) {
      try { unsubRef.current(); } catch {}
      unsubRef.current = null;
    }
    if (!uid) {
      setNotifications([]);
      return;
    }
    const r = ref(db, `notifications/users/${uid}`);
    const handler = (snap: DataSnapshot) => {
      const val = snap.val() || {};
      const list: Notification[] = Object.values(val).map((v: any) => ({
        id: v.id,
        type: v.type,
        message: v.message,
        createdAt: v.createdAt ?? Date.now(),
        read: !!(readMap[v.id]) || !!v.read,
        route: v.route ?? formatRouteForType(v.type, v.meta),
        meta: v.meta ?? {},
      }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(list);
    };
    onValue(r, handler);
    unsubRef.current = () => off(r, 'value', handler);
    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Keep read state in sync when notifications change
  useEffect(() => {
    if (!uid) return;
    const next = { ...readMap };
    for (const n of notifications) {
      if (n.read) next[n.id] = true;
    }
    persistReadMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Allow modules to dispatch notifications via global event
  useEffect(() => {
    const onAdd = (e: Event) => {
      try {
        const d = (e as CustomEvent).detail as NotificationInput;
        if (d && d.type && d.message) {
          addNotification(d, true);
        }
      } catch {}
    };
    document.addEventListener('notifications:add', onAdd as EventListener);
    return () => document.removeEventListener('notifications:add', onAdd as EventListener);
  }, [uid]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const addNotification = async (n: NotificationInput, persistToDb = false): Promise<Notification> => {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = n.createdAt ?? Date.now();
    const route = n.route ?? formatRouteForType(n.type, n.meta);
    const notif: Notification = { id, type: n.type, message: n.message, createdAt, read: !!n.read, route, meta: n.meta ?? {} };
    setNotifications((prev) => [notif, ...prev]);
    if (persistToDb && uid) {
      const r = ref(db, `notifications/users/${uid}/${id}`);
      await set(r, notif);
    }
    return notif;
  };

  const markAsRead = async (id: string) => {
    const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(next);
    if (uid) {
      const r = ref(db, `notifications/users/${uid}/${id}`);
      await update(r, { read: true });
    }
    const m = { ...readMap, [id]: true };
    persistReadMap(m);
  };

  const markAllAsRead = async () => {
    const ids = notifications.map((n) => n.id);
    const next = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    if (uid) {
      const updates: Record<string, any> = {};
      for (const id of ids) updates[`notifications/users/${uid}/${id}/read`] = true;
      await update(ref(db, '/'), updates);
    }
    const m: Record<string, boolean> = {};
    for (const id of ids) m[id] = true;
    persistReadMap(m);
  };

  const removeNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (uid) {
      await update(ref(db, `notifications/users/${uid}/${id}`), { deletedAt: Date.now() });
    }
  };

  const clear = async () => {
    setNotifications([]);
    if (uid) {
      await update(ref(db, `notifications/users/${uid}`), { clearedAt: Date.now() });
    }
  };

  const value: Ctx = { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clear };
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): Ctx {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}