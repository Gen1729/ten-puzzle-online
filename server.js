const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// 型定義（JavaScript版なのでコメントで記載）
/*
interface Player {
  socketId: string;
  name: string;
  score: number;
  correct: number;
  wrong: number;
  skip: number;
}

interface GameState {
  currentNumbers: number[];
  timeLeft: number;
  isActive: boolean;
}

interface GameRoom {
  players: Player[];
  gameState: GameState;
}
*/

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // ゲームルーム管理
  const gameRooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // ルーム参加
    socket.on('join-room', (roomId, playerName) => {
      socket.join(roomId);
      
      if (!gameRooms.has(roomId)) {
        gameRooms.set(roomId, {
          players: [],
          gameState: {
            currentNumbers: generateRandomNumbers(),
            timeLeft: 180,
            isActive: false
          }
        });
      }

      const room = gameRooms.get(roomId);
      const existingPlayer = room.players.find(p => p.socketId === socket.id);
      
      if (!existingPlayer) {
        room.players.push({
          socketId: socket.id,
          name: playerName,
          score: 0,
          correct: 0,
          wrong: 0,
          skip: 0,
          currentNumbers: generateRandomNumbers() // 各プレイヤー個別の問題
        });
      }

      socket.emit('room-joined', {
        roomId,
        players: room.players,
        gameState: room.gameState
      });

      socket.to(roomId).emit('player-joined', {
        players: room.players
      });

      console.log(`Player ${playerName} joined room ${roomId}`);
    });

    // 数字更新
    socket.on('update-numbers', (roomId, numbers) => {
      const room = gameRooms.get(roomId);
      if (room) {
        room.gameState.currentNumbers = numbers;
        io.to(roomId).emit('numbers-updated', numbers);
      }
    });

    // 正解提出（サーバー側で検証）
    socket.on('submit-answer', (roomId, formula) => {
      console.log(`Answer submitted: ${formula}, roomId: ${roomId}`);
      
      const room = gameRooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          console.log(`Player ${player.name} before update:`, { score: player.score, correct: player.correct, wrong: player.wrong });
          
          try {
            // サーバー側で数字使用チェック
            const isValidNumbers = validateNumbersUsage(formula, player.currentNumbers);
            if (!isValidNumbers) {
              socket.emit('answer-result', {
                success: false,
                message: '指定された数字のみを使用してください',
                formula
              });
              return;
            }

            // サーバー側で計算結果チェック
            const result = evaluateFormula(formula);
            const isCorrect = Math.abs(result - 10) < 1e-10;
            
            if (isCorrect) {
              player.score += 10;
              player.correct += 1;
              // 新しい問題を生成（個別）
              player.currentNumbers = generateRandomNumbers();
              console.log(`Correct answer! Updated player ${player.name}:`, { score: player.score, correct: player.correct });
              
              socket.emit('answer-result', {
                success: true,
                isCorrect: true,
                message: '正解！',
                formula,
                newNumbers: player.currentNumbers,
                result
              });
            } else {
              player.wrong += 1;
              console.log(`Wrong answer (${result}). Updated player ${player.name}:`, { score: player.score, wrong: player.wrong });
              
              socket.emit('answer-result', {
                success: true,
                isCorrect: false,
                message: `不正解... ${formula} = ${result} (10ではありません)`,
                formula,
                result
              });
            }

            // 全プレイヤーに更新されたプレイヤーリストを送信
            io.to(roomId).emit('players-updated', room.players);

          } catch (error) {
            console.error('Formula evaluation error:', error);
            socket.emit('answer-result', {
              success: false,
              message: '数式が正しくありません',
              formula
            });
          }
        }
      }
    });

    // スキップ
    socket.on('skip-problem', (roomId) => {
      console.log(`Skip problem requested, roomId: ${roomId}`);
      
      const room = gameRooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          console.log(`Player ${player.name} before skip:`, { score: player.score, skip: player.skip });
          
          player.skip += 1;
          player.score = Math.max(0, player.score - 3); // スキップペナルティ
          
          console.log(`Player ${player.name} after skip:`, { score: player.score, skip: player.skip });
          
          // 新しい数字を生成（個別）
          player.currentNumbers = generateRandomNumbers();
          console.log('Generated new numbers for skip:', player.currentNumbers);

          socket.emit('skip-result', {
            newNumbers: player.currentNumbers,
            message: 'スキップしました（-3pt）',
            score: player.score
          });

          // 全プレイヤーに更新されたプレイヤーリストを送信
          console.log('All players after skip:', room.players.map(p => ({ name: p.name, score: p.score, skip: p.skip })));
          io.to(roomId).emit('players-updated', room.players);
        }
      }
    });

    // ゲーム開始
    socket.on('start-game', (roomId) => {
      const room = gameRooms.get(roomId);
      if (room) {
        room.gameState.isActive = true;
        room.gameState.timeLeft = 180;
        
        // 新しい数字を生成
        const newNumbers = generateRandomNumbers();
        room.gameState.currentNumbers = newNumbers;

        io.to(roomId).emit('game-started', {
          gameState: room.gameState
        });

        // タイマー開始
        const timer = setInterval(() => {
          room.gameState.timeLeft -= 1;
          io.to(roomId).emit('time-update', room.gameState.timeLeft);

          if (room.gameState.timeLeft <= 0) {
            clearInterval(timer);
            room.gameState.isActive = false;
            
            // 最終結果を準備
            const finalPlayers = room.players
              .map(p => ({
                name: p.name,
                score: p.score,
                correct: p.correct,
                wrong: p.wrong,
                skip: p.skip
              }))
              .sort((a, b) => b.score - a.score);

            io.to(roomId).emit('game-ended', {
              players: finalPlayers,
              roomId: roomId,
              gameTime: 180
            });
          }
        }, 1000);
      }
    });

    // 切断処理
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // 全ルームからプレイヤーを削除
      gameRooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          
          socket.to(roomId).emit('player-left', {
            playerName: player.name,
            players: room.players
          });

          // ルームが空になったら削除
          if (room.players.length === 0) {
            gameRooms.delete(roomId);
          }
        }
      });
    });
  });

  // ランダムな数字を生成する関数
  function generateRandomNumbers() {
    const numbers = [];
    for (let i = 0; i < 4; i++) {
      numbers.push(Math.floor(Math.random() * 9) + 1);
    }
    return numbers;
  }

  // 数式を評価する関数（簡易版）
  function evaluateFormula(formula) {
    // ×と÷を*と/に変換
    const normalizedFormula = formula.replace(/×/g, '*').replace(/÷/g, '/');
    
    // 危険な文字をチェック
    if (!/^[0-9+\-*/().\s]+$/.test(normalizedFormula)) {
      throw new Error('不正な文字が含まれています');
    }
    
    // evalを使用（本来はより安全なパーサーを使うべき）
    try {
      const result = Function('"use strict"; return (' + normalizedFormula + ')')();
      return result;
    } catch {
      throw new Error('数式の評価に失敗しました');
    }
  }

  // 数字の使用をチェックする関数
  function validateNumbersUsage(formula, allowedNumbers) {
    // 数式から数字を抽出
    const numbersInFormula = formula.match(/\d+/g);
    if (!numbersInFormula) return true;

    const usedNumbers = numbersInFormula.map(Number);
    const availableNumbers = [...allowedNumbers];

    // 各使用された数字をチェック
    for (const num of usedNumbers) {
      const index = availableNumbers.indexOf(num);
      if (index === -1) {
        return false; // 使用不可能な数字
      }
      availableNumbers.splice(index, 1); // 使用済みとしてマーク
    }

    return true;
  }

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
