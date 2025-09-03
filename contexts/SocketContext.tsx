'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Player, GameState } from '../types/game';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string, playerName: string) => void;
  submitAnswer: (roomId: string, formula: string) => void;
  skipProblem: (roomId: string) => void;
  startGame: (roomId: string) => void;
  players: Player[];
  gameState: GameState | null;
  roomId: string | null;
  myNumbers: number[];
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myNumbers, setMyNumbers] = useState<number[]>([]);

  useEffect(() => {
    const socketIo = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socketIo.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // ルーム参加成功
    socketIo.on('room-joined', (data) => {
      console.log('Room joined:', data);
      setRoomId(data.roomId);
      setPlayers(data.players);
      setGameState(data.gameState);
      
      // 自分の数字を設定
      const myPlayer = data.players.find((p: Player) => p.socketId === socketIo.id);
      if (myPlayer && myPlayer.currentNumbers) {
        setMyNumbers(myPlayer.currentNumbers);
      }
    });

    // プレイヤー参加通知
    socketIo.on('player-joined', (data) => {
      setPlayers(data.players);
    });

    // プレイヤー退出通知
    socketIo.on('player-left', (data) => {
      console.log(`${data.playerName} left the game`);
      setPlayers(data.players);
    });

    // プレイヤーリスト更新
    socketIo.on('players-updated', (players) => {
      setPlayers(players);
    });

    // 回答結果
    socketIo.on('answer-result', (data) => {
      console.log('Answer result:', data);
      if (data.newNumbers) {
        setMyNumbers(data.newNumbers);
      }
    });

    // スキップ結果
    socketIo.on('skip-result', (data) => {
      console.log('Skip result:', data);
      if (data.newNumbers) {
        setMyNumbers(data.newNumbers);
      }
      // スキップメッセージは各ページで個別に処理する
    });

    // ゲーム開始
    socketIo.on('game-started', (data) => {
      console.log('Game started:', data);
      setGameState(data.gameState);
    });

    // タイマー更新
    socketIo.on('time-update', (timeLeft) => {
      setGameState(prev => prev ? { ...prev, timeLeft } : null);
    });

    // ゲーム終了
    socketIo.on('game-ended', (data) => {
      console.log('Game ended:', data);
      setPlayers(data.players);
      setGameState(prev => prev ? { ...prev, isActive: false } : null);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      socket.emit('join-room', roomId, playerName);
    }
  };

  const submitAnswer = (roomId: string, formula: string) => {
    if (socket) {
      socket.emit('submit-answer', roomId, formula);
    }
  };

  const skipProblem = (roomId: string) => {
    if (socket) {
      socket.emit('skip-problem', roomId);
    }
  };

  const startGame = (roomId: string) => {
    if (socket) {
      socket.emit('start-game', roomId);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinRoom,
    submitAnswer,
    skipProblem,
    startGame,
    players,
    gameState,
    roomId,
    myNumbers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
