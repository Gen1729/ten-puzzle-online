const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// 問題データ
const easyProblems = [
  '1124', '1223', '1478', '2468', '0446', '1118', '1355', '2466',
  '1258', '2378', '0255', '1268', '2888', '3337', '3777', '4666',
  '1227', '4446', '1135', '1467', '1678', '2555', '3579', '3678',
  '4589', '5689', '2459', '2589', '1579', '2346', '2348', '2789',
  '1348', '4789', '0379', '2225', '3568', '0289', '1224', '2228',
  '1357', '2347', '4567', '0055', '0238', '0456', '1126', '1249',
  '2479', '4578', '2369', '3469', '2569', '0234', '1267', '0118',
  '0244', '0334', '1899', '1999', '0355', '1225', '3458', '1256',
  '3569', '1156', '1334', '0258', '1138', '1147', '1244', '3689',
  '0356', '0458', '1155', '5678', '2356', '1568', '2457', '1238',
  '2349', '0268', '2679', '1129', '1368', '2567', '1236', '1247',
  '1578', '1468', '2566', '2599', '3447', '3667', '3799', '4699',
  '1257', '2899', '3557', '3788', '2558', '2577', '2588', '2778',
  '4556', '4677', '1367', '2237', '3346', '2445', '0138', '0147',
  '0156', '0239', '0349', '0358', '0459', '0569', '0578', '0679',
  '0789', '1358', '1789', '2335', '2338', '4688', '1349', '1679',
  '1229', '1339', '1449', '1559', '1779', '1889', '1239', '1569',
  '1669', '2345', '1119', '1459', '2448', '1226', '1136', '2668',
  '0025', '1127', '1248', '0226', '0155', '1145', '1356', '3456',
  '2246', '0019', '0028', '0037', '0046', '0257', '0127', '0129',
  '0136', '0145', '0367', '0468', '0245', '1125', '1235', '1128',
  '1137', '1146', '1458', '0248', '1234', '0235', '1245', '0119',
  '0125', '0128', '0137', '0146'
];

const normalProblems = [
  '1457', '0455', '0555', '0556', '0558', '1133', '1139', '1144',
  '1157', '1799', '2248', '2249', '2446', '2447', '2455', '3459',
  '3556', '4689', '2444', '5555', '0115', '1255', '1289', '1557',
  '2269', '2288', '2368', '2578', '2699', '2799', '2889', '3347',
  '3599', '3699', '4599', '0133', '0229', '0267', '0339', '0449',
  '0488', '0669', '0779', '0889', '0999', '1377', '2256', '3379',
  '0247', '1148', '1379', '1488', '2469', '2788', '3356', '3578',
  '3677', '3778', '4566', '1588', '4667', '2244', '2389', '4557',
  '2579', '3668', '0126', '0135', '0227', '0249', '0568', '0579',
  '1246', '2224', '2233', '2556', '1345', '2456', '1369', '2247',
  '2366', '1456', '2488', '2234', '2478', '2678', '2689', '4568',
  '1344', '1788', '2259', '3348', '3889', '4457', '4479', '4778',
  '5667', '5779', '6679', '3479', '2268', '2467', '3445', '4458',
  '1228', '1233', '2238', '1335', '2379', '2236', '2489', '3345',
  '4468', '1577', '2568', '3455', '1366', '2677', '3359', '0225',
  '0256', '0259', '1237', '3468', '3589', '3566', '2337', '4456',
  '2344', '2239', '0139', '0149', '0159', '0169', '0179', '0189',
  '0199', '0228', '0237', '0246', '0278', '0288', '0337', '0346',
  '0347', '0357', '0377', '0378', '0466', '0467', '0469', '1477',
  '1688', '1689', '2258', '3457', '2458', '1359', '2359', '2357',
  '3567', '0124', '0223', '0559', '1469', '0224', '3489', '4455',
  '5566', '5577', '5588', '5599', '0368', '0557', '3446', '2336',
  '4678', '1266', '3355', '2255', '0266', '0477', '0688', '0899'
];

const difficultProblems = [
  '1158', '1116', '1149', '1167', '1189', '2289', '2666', '3333',
  '3357', '3366', '3377', '3478', '3577', '3588', '4466', '4467',
  '4559', '5557', '7778', '7899', '8888', '8999', '9999', '1277',
  '4888', '5889', '6678', '6779', '1114', '1168', '1199', '1337',
  '1388', '1555', '1566', '1599', '3344', '3466', '4449', '4679',
  '5559', '5679', '5778', '6889', '7779', '7889', '8889', '1269',
  '6688', '6689', '6799', '1336', '2299', '2477', '3555', '4779',
  '6788', '1479', '1288', '1347', '1445', '1447', '2222', '2279',
  '2333', '2339', '2399', '2669', '2999', '3334', '3339', '3449',
  '3477', '3488', '3558', '3888', '4447', '4448', '4777', '4788',
  '4889', '5669', '5699', '5777', '5888', '5999', '1378', '2278',
  '1389', '2266', '2367', '3335', '3499', '3559', '5677', '1279',
  '1778', '1888', '2226', '2334', '2358', '2499', '2557', '2777',
  '3336', '3338', '3349', '3367', '4478', '4569', '5558', '5568',
  '6669', '1489', '2388', '3389', '3679', '5688', '3368', '3399',
  '1166', '2688', '4499', '1222', '1338', '1466', '1556', '1668',
  '3378', '3467', '3899', '4669', '4799', '5578', '5666', '6699',
  '2355', '3388', '4668', '6668', '1134', '1299', '1455', '2227',
  '2229', '4489', '4577', '2277', '3666', '1117', '1259', '1346',
  '1567', '2779', '4445', '4488', '4588', '5556', '5579', '5589',
  '1589', '6789', '2377', '3369', '4469', '5569', '2235', '1123',
  '1278', '1333', '1446', '2223', '2245', '2267', '2449', '3688',
  '2559', '5789', '3358', '1115', '1448', '1558', '2667', '3448',
  '3789', '4555', '4579', '5567'
];

// 問題文字列を数字配列に変換する関数
const convertProblemToNumbers = (problemStr) => {
  return problemStr.split('').map(char => parseInt(char));
};

// ゲーム用の問題シーケンスを生成する関数（各難易度から均等に選択）
const generateProblemSequence = (count = 90) => {
  const sequence = [];
  const difficulties = [
    { name: 'easy', problems: [...easyProblems], usedProblems: new Set() },
    { name: 'normal', problems: [...normalProblems], usedProblems: new Set() },
    { name: 'difficult', problems: [...difficultProblems], usedProblems: new Set() }
  ];
  
  // 各難易度のインデックス
  let difficultyIndex = 0;
  
  while (sequence.length < count) {
    const currentDifficulty = difficulties[difficultyIndex];
    const availableProblems = currentDifficulty.problems.filter(
      problem => !currentDifficulty.usedProblems.has(problem)
    );
    
    if (availableProblems.length > 0) {
      // その難易度から問題をランダム選択
      const randomIndex = Math.floor(Math.random() * availableProblems.length);
      const selectedProblem = availableProblems[randomIndex];
      
      currentDifficulty.usedProblems.add(selectedProblem);
      sequence.push({
        numbers: convertProblemToNumbers(selectedProblem),
        difficulty: currentDifficulty.name,
        originalProblem: selectedProblem
      });
    } else {
      // その難易度の問題が尽きた場合、使用済みをリセット
      currentDifficulty.usedProblems.clear();
    }
    
    // 次の難易度に移る（easy -> normal -> difficult -> easy の循環）
    difficultyIndex = (difficultyIndex + 1) % difficulties.length;
  }
  
  return sequence;
};

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
            timeLeft: 180,
            isActive: false
          },
          problemSequence: generateProblemSequence(), // 共通の問題シーケンス
          currentProblemIndex: 0 // 現在の問題インデックス
        });
      }

      const room = gameRooms.get(roomId);
      const existingPlayer = room.players.find(p => p.socketId === socket.id);
      
      if (!existingPlayer) {
        // 新しいプレイヤーは現在の問題から開始
        const currentProblem = room.problemSequence[room.currentProblemIndex];
        room.players.push({
          socketId: socket.id,
          name: playerName,
          score: 0,
          correct: 0,
          wrong: 0,
          skip: 0,
          currentNumbers: currentProblem.numbers, // 全員同じ問題
          problemIndex: room.currentProblemIndex // プレイヤーの現在の問題インデックス
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
              // 次の問題に進む
              player.problemIndex += 1;
              if (player.problemIndex < room.problemSequence.length) {
                const nextProblem = room.problemSequence[player.problemIndex];
                player.currentNumbers = nextProblem.numbers;
                console.log(`Player ${player.name} advanced to problem ${player.problemIndex + 1} (${nextProblem.difficulty}): ${nextProblem.originalProblem}`);
              } else {
                // 問題が尽きた場合は最初から循環
                player.problemIndex = 0;
                const firstProblem = room.problemSequence[0];
                player.currentNumbers = firstProblem.numbers;
                console.log(`Player ${player.name} completed all problems, restarting from problem 1 (${firstProblem.difficulty}): ${firstProblem.originalProblem}`);
              }
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
          
          // 次の問題に進む
          player.problemIndex += 1;
          if (player.problemIndex < room.problemSequence.length) {
            const nextProblem = room.problemSequence[player.problemIndex];
            player.currentNumbers = nextProblem.numbers;
            console.log(`Player ${player.name} skipped to problem ${player.problemIndex + 1} (${nextProblem.difficulty}): ${nextProblem.originalProblem}`);
          } else {
            // 問題が尽きた場合は最初から循環
            player.problemIndex = 0;
            const firstProblem = room.problemSequence[0];
            player.currentNumbers = firstProblem.numbers;
            console.log(`Player ${player.name} completed all problems, restarting from problem 1 (${firstProblem.difficulty}): ${firstProblem.originalProblem}`);
          }
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
        
        // 全員が最初の問題から開始
        room.currentProblemIndex = 0;
        const firstProblem = room.problemSequence[0];
        
        console.log(`Game started with problem sequence. First problem (${firstProblem.difficulty}): ${firstProblem.originalProblem}`);
        console.log('Problem sequence preview:', room.problemSequence.slice(0, 10).map((p, i) => `${i+1}. ${p.difficulty}:${p.originalProblem}`));
        
        // 全プレイヤーを最初の問題にリセット
        room.players.forEach(player => {
          player.problemIndex = 0;
          player.currentNumbers = firstProblem.numbers;
        });

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
