'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { Player, GameState } from '../types/game';

interface SocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  joinRoom: (roomId: string, playerName: string) => void;
  submitAnswer: (roomId: string, formula: string) => void;
  skipProblem: (roomId: string) => void;
  startGame: (roomId: string) => void;
  players: Player[];
  gameState: GameState | null;
  roomId: string | null;
  myNumbers: number[];
  waitingCountdown: number | null;
  startCountdown: number | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myNumbers, setMyNumbers] = useState<number[]>([]);
  const [waitingCountdown, setWaitingCountdown] = useState<number | null>(null);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, [ws]);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
    
    newWs.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setWs(null);
      
      // 自動再接続
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
    
    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setWs(newWs);
  }, []);

  const handleMessage = useCallback((data: Record<string, unknown>) => {
    const { type, payload } = data;
    
    switch (type) {
      case 'connected':
        console.log('Connected with client ID:', (payload as { clientId?: string })?.clientId);
        break;
        
      case 'room-joined':
        {
          const p = payload as { roomId: string; players: Player[]; gameState: GameState };
          setRoomId(p.roomId);
          setPlayers(p.players);
          setGameState(p.gameState);
          // 自分の現在の数字を設定
          const myPlayer = p.players.find((player: Player) => player.name === localStorage.getItem('playerName'));
          if (myPlayer && myPlayer.currentNumbers) {
            setMyNumbers(myPlayer.currentNumbers);
          }
        }
        break;
        
      case 'player-joined':
        {
          const p = payload as { players: Player[] };
          setPlayers(p.players);
        }
        break;
        
      case 'player-left':
        {
          const p = payload as { players: Player[] };
          setPlayers(p.players);
        }
        break;
        
      case 'players-updated':
        {
          const p = payload as { players: Player[] };
          setPlayers(p.players);
        }
        break;
        
      case 'waiting-countdown-start':
        {
          const p = payload as { countdown: number };
          setWaitingCountdown(p.countdown);
          console.log('Waiting countdown started:', p.countdown);
        }
        break;
        
      case 'waiting-countdown-update':
        {
          const p = payload as { countdown: number };
          setWaitingCountdown(p.countdown);
          console.log('Waiting countdown:', p.countdown);
        }
        break;
        
      case 'start-countdown-begin':
        {
          const p = payload as { countdown: number };
          setWaitingCountdown(null);
          setStartCountdown(p.countdown);
          console.log('Start countdown begin:', p.countdown);
        }
        break;
        
      case 'start-countdown-update':
        {
          const p = payload as { countdown: number };
          setStartCountdown(p.countdown);
          console.log('Start countdown:', p.countdown);
        }
        break;
        
      case 'game-started':
        {
          const p = payload as { gameState: GameState };
          setWaitingCountdown(null);
          setStartCountdown(null);
          setGameState(p.gameState);
        }
        break;
        
      case 'time-update':
        {
          const p = payload as { timeLeft: number };
          setGameState(prev => prev ? { ...prev, timeLeft: p.timeLeft } : null);
        }
        break;
        
      case 'game-ended':
        setGameState(prev => prev ? { ...prev, isActive: false } : null);
        console.log('Game ended:', payload);
        break;
        
      case 'answer-result':
        {
          const p = payload as { success: boolean; isCorrect?: boolean; newNumbers?: number[]; message: string };
          if (p.success && p.isCorrect && p.newNumbers) {
            setMyNumbers(p.newNumbers);
          }
          console.log('Answer result:', p.message);
        }
        break;
        
      case 'skip-result':
        {
          const p = payload as { newNumbers?: number[]; message: string };
          if (p.newNumbers) {
            setMyNumbers(p.newNumbers);
          }
          console.log('Skip result:', p.message);
        }
        break;
        
      case 'error':
        {
          const p = payload as { message?: string };
          console.error('Server error:', p.message || 'Unknown error');
        }
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  }, []);

  useEffect(() => {
    if (!ws) {
      connect();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, ws]);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    localStorage.setItem('playerName', playerName);
    sendMessage({
      type: 'join-room',
      payload: { roomId, playerName }
    });
  }, [sendMessage]);

  const submitAnswer = useCallback((roomId: string, formula: string) => {
    sendMessage({
      type: 'submit-answer',
      payload: { roomId, formula }
    });
  }, [sendMessage]);

  const skipProblem = useCallback((roomId: string) => {
    sendMessage({
      type: 'skip-problem',
      payload: { roomId }
    });
  }, [sendMessage]);

  const startGame = useCallback((roomId: string) => {
    sendMessage({
      type: 'start-game',
      payload: { roomId }
    });
  }, [sendMessage]);

  const value: SocketContextType = {
    ws,
    isConnected,
    joinRoom,
    submitAnswer,
    skipProblem,
    startGame,
    players,
    gameState,
    roomId,
    myNumbers,
    waitingCountdown,
    startCountdown
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
