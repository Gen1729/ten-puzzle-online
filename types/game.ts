// ゲーム関連の型定義
export interface Player {
  socketId: string;
  name: string;
  score: number;
  correct: number;
  wrong: number;
  skip: number;
  currentNumbers?: number[];
}

export interface GameState {
  currentNumbers: number[];
  timeLeft: number;
  isActive: boolean;
}

export interface GameRoom {
  players: Player[];
  gameState: GameState;
}

export interface AnswerSubmitData {
  playerId: string;
  playerName: string;
  formula: string;
  isCorrect: boolean;
  players: Player[];
}

export interface RoomJoinedData {
  roomId: string;
  players: Player[];
  gameState: GameState;
}
