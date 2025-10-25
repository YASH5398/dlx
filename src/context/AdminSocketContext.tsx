import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';

type AdminSocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  notifications: any[];
  addNotification: (notification: any) => void;
  clearNotifications: () => void;
};

const AdminSocketContext = createContext<AdminSocketContextType | undefined>(undefined);

export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Admin socket connected');
      setIsConnected(true);
      
      // Identify as admin
      newSocket.emit('identify', { role: 'admin', userId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('Admin socket disconnected');
      setIsConnected(false);
    });

    // Listen for AI chat notifications
    newSocket.on('ai:chat:new', (data) => {
      console.log('AI chat notification:', data);
      addNotification({
        id: `ai_chat_${Date.now()}`,
        type: 'ai_chat',
        title: 'New AI Chat Message',
        message: `User ${data.userId} sent: ${data.content.substring(0, 100)}...`,
        timestamp: data.timestamp,
        userId: data.userId,
        content: data.content,
      });
    });

    // Listen for ticket notifications
    newSocket.on('ticket:new', (data) => {
      console.log('Ticket notification:', data);
      addNotification({
        id: `ticket_${Date.now()}`,
        type: 'ticket',
        title: 'New Support Ticket',
        message: `New ticket: ${data.ticket?.subject || 'Support Request'}`,
        timestamp: Date.now(),
        ticket: data.ticket,
      });
    });

    // Listen for agent status updates
    newSocket.on('agent:status', (data) => {
      console.log('Agent status update:', data);
      addNotification({
        id: `agent_status_${Date.now()}`,
        type: 'agent_status',
        title: 'Agent Status Update',
        message: `Agent is now ${data.available ? 'available' : 'unavailable'}`,
        timestamp: Date.now(),
        available: data.available,
      });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: AdminSocketContextType = {
    socket,
    isConnected,
    notifications,
    addNotification,
    clearNotifications,
  };

  return (
    <AdminSocketContext.Provider value={value}>
      {children}
    </AdminSocketContext.Provider>
  );
}

export function useAdminSocket(): AdminSocketContextType {
  const context = useContext(AdminSocketContext);
  if (!context) {
    throw new Error('useAdminSocket must be used within AdminSocketProvider');
  }
  return context;
}
