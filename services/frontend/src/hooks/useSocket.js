import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef({});

  useEffect(() => {
    // Connect only once
    if (!socket) {
      const url = window.location.origin;
      socket = io(url, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      });
    }

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error:', err.message);
    });

    return () => {
      // Don't disconnect on unmount — keep alive for the app lifetime
    };
  }, []);

  const on = useCallback((event, callback) => {
    if (!socket) return;
    // Remove previous listener for this event to prevent duplicates
    if (listenersRef.current[event]) {
      socket.off(event, listenersRef.current[event]);
    }
    listenersRef.current[event] = callback;
    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
      delete listenersRef.current[event];
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  }, []);

  return { connected, on, emit };
};
