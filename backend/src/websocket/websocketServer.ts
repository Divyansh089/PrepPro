import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface WSMessage {
  type: 'SUBSCRIBE_LEADERBOARD' | 'PING' | 'USER_ACTIVITY';
  payload?: any;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  console.log('⚡ WebSocket server attached to HTTP server at /ws');

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log(`🌐 WebSocket client connected (Total active: ${clients.size})`);

    // Send initial online user count to newly connected client
    sendToClient(ws, {
      type: 'ONLINE_USERS_COUNT',
      payload: { count: clients.size },
    });

    // Broadcast updated online count to all clients
    broadcastOnlineUsersCount();

    ws.on('message', (data: string) => {
      try {
        const msg: WSMessage = JSON.parse(data);
        if (msg.type === 'PING') {
          sendToClient(ws, { type: 'PONG', payload: { timestamp: Date.now() } });
        }
      } catch (err) {
        console.warn('Malformed WebSocket message received');
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`🔌 WebSocket client disconnected (Remaining active: ${clients.size})`);
      broadcastOnlineUsersCount();
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

function sendToClient(ws: WebSocket, payload: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function broadcastLeaderboardUpdate(leaderboardData: any[]) {
  const payload = JSON.stringify({
    type: 'LEADERBOARD_UPDATED',
    payload: {
      timestamp: Date.now(),
      leaderboard: leaderboardData,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

export function broadcastOnlineUsersCount() {
  const payload = JSON.stringify({
    type: 'ONLINE_USERS_COUNT',
    payload: {
      count: clients.size,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

export function streamInterviewChunk(sessionId: string, textChunk: string) {
  const payload = JSON.stringify({
    type: 'INTERVIEW_SPEECH_STREAM',
    payload: {
      sessionId,
      chunk: textChunk,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
