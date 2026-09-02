"use client";

import { useEffect, useState, useRef } from 'react';

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  totalScore: number;
  testsCompleted: number;
  accuracy: number;
  targetRole?: string;
  college?: string;
}

export function useLeaderboardWebSocket() {
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [liveLeaderboard, setLiveLeaderboard] = useState<LeaderboardUser[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        // Subscribe to leaderboard updates
        socket.send(JSON.stringify({ type: 'SUBSCRIBE_LEADERBOARD' }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ONLINE_USERS_COUNT') {
            setOnlineCount(data.payload.count || 1);
          } else if (data.type === 'LEADERBOARD_UPDATED') {
            if (Array.isArray(data.payload.leaderboard)) {
              setLiveLeaderboard(data.payload.leaderboard);
              setLastUpdated(new Date());
            }
          }
        } catch (err) {
          // ignore parsing error
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      setIsConnected(false);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    onlineCount,
    liveLeaderboard,
    lastUpdated,
    isConnected,
  };
}
