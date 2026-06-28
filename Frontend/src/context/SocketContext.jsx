import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.io server');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error:', err.message);
    });

    // Listen for new collaboration requests
    newSocket.on('NEW_COLLABORATION_REQUEST', (data) => {
      console.log('📣 Real-time notification received: NEW_COLLABORATION_REQUEST', data);
      setNotifications((prev) => [data.notification, ...prev]);
    });

    // Listen for collaboration request accepts
    newSocket.on('COLLABORATION_REQUEST_ACCEPTED', (data) => {
      console.log('📣 Real-time notification received: COLLABORATION_REQUEST_ACCEPTED', data);
      setNotifications((prev) => [data.notification, ...prev]);
    });

    // Listen for connection requests
    newSocket.on('NEW_CONNECTION_REQUEST', (data) => {
      console.log('📣 Real-time notification received: NEW_CONNECTION_REQUEST', data);
      setNotifications((prev) => [data.notification, ...prev]);
    });

    // Listen for connection accepts
    newSocket.on('CONNECTION_REQUEST_ACCEPTED', (data) => {
      console.log('📣 Real-time notification received: CONNECTION_REQUEST_ACCEPTED', data);
      setNotifications((prev) => [data.notification, ...prev]);
    });

    // Listen for new followers
    newSocket.on('NEW_FOLLOWER', (data) => {
      console.log('📣 Real-time notification received: NEW_FOLLOWER', data);
      setNotifications((prev) => [data.notification, ...prev]);
    });

    // Listen for new publications from followed researchers
    newSocket.on('NEW_PUBLICATION_BY_FOLLOWED', (data) => {
      console.log('📣 Real-time notification received: NEW_PUBLICATION_BY_FOLLOWED', data);
      setNotifications((prev) => [data.notification, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Load initial notifications from database
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Fetch collaboration notifications from backend (optional, but we can store them locally)
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
