import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import next from 'next';
import { v4 as uuidv4 } from 'uuid';

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

// 問題文字列を数字配列に変換
const convertProblemToNumbers = (problemStr) => {
  return problemStr.split('').map(char => parseInt(char));
};

// 問題シーケンス生成
const generateProblemSequence = (count = 90) => {
  const sequence = [];
  const difficulties = [
    { name: 'easy', problems: [...easyProblems], usedProblems: new Set() },
    { name: 'normal', problems: [...normalProblems], usedProblems: new Set() },
    { name: 'difficult', problems: [...difficultProblems], usedProblems: new Set() }
  ];
  
  let difficultyIndex = 0;
  
  while (sequence.length < count) {
    const currentDifficulty = difficulties[difficultyIndex];
    const availableProblems = currentDifficulty.problems.filter(
      problem => !currentDifficulty.usedProblems.has(problem)
    );
    
    if (availableProblems.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableProblems.length);
      const selectedProblem = availableProblems[randomIndex];
      
      currentDifficulty.usedProblems.add(selectedProblem);
      sequence.push({
        numbers: convertProblemToNumbers(selectedProblem),
        difficulty: currentDifficulty.name,
        originalProblem: selectedProblem
      });
    } else {
      currentDifficulty.usedProblems.clear();
    }
    
    difficultyIndex = (difficultyIndex + 1) % difficulties.length;
  }
  
  return sequence;
};

// 数式評価
function evaluateFormula(formula) {
  const normalizedFormula = formula.replace(/×/g, '*').replace(/÷/g, '/');
  
  if (!/^[0-9+\-*/().\s]+$/.test(normalizedFormula)) {
    throw new Error('不正な文字が含まれています');
  }
  
  try {
    const result = Function('"use strict"; return (' + normalizedFormula + ')')();
    return result;
  } catch {
    throw new Error('数式の評価に失敗しました');
  }
}

// 数字使用チェック
function validateNumbersUsage(formula, allowedNumbers) {
  const numbersInFormula = formula.match(/\d+/g);
  if (!numbersInFormula) return true;

  const usedNumbers = numbersInFormula.map(Number);
  const availableNumbers = [...allowedNumbers];

  for (const num of usedNumbers) {
    const index = availableNumbers.indexOf(num);
    if (index === -1) {
      return false;
    }
    availableNumbers.splice(index, 1);
  }

  return true;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // WebSocket以外のリクエストはNext.jsに渡す
    if (req.url.startsWith('/ws')) {
      // WebSocketハンドシェイクはWebSocketサーバーが処理
      return;
    }
    return handler(req, res);
  });
  
  // WebSocketサーバーの初期化
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  // ゲーム状態管理
  const gameRooms = new Map();
  const clients = new Map();

  console.log('WebSocket server initialized on /ws');

  // WebSocket接続処理
  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    clients.set(clientId, { ws, rooms: new Set() });
    
    console.log('WebSocket client connected:', clientId);

    // 接続確認
    sendToClient(clientId, { type: 'connected', clientId });

    // メッセージ処理
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(clientId, data);
      } catch (error) {
        console.error('Invalid message format:', error);
        sendToClient(clientId, { type: 'error', message: 'Invalid message format' });
      }
    });

    // 切断処理
    ws.on('close', () => {
      console.log('WebSocket client disconnected:', clientId);
      handleDisconnect(clientId);
    });
  });

  // ユーティリティ関数
  function sendToClient(clientId, message) {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  function broadcastToRoom(roomId, message, excludeClientId = null) {
    const room = gameRooms.get(roomId);
    if (!room) return;

    room.players.forEach(player => {
      if (player.clientId !== excludeClientId) {
        sendToClient(player.clientId, message);
      }
    });
  }

  // メッセージハンドラー
  function handleMessage(clientId, data) {
    const { type, payload } = data;

    switch (type) {
      case 'join-room':
        handleJoinRoom(clientId, payload);
        break;
      case 'submit-answer':
        handleSubmitAnswer(clientId, payload);
        break;
      case 'skip-problem':
        handleSkipProblem(clientId, payload);
        break;
      case 'start-game':
        handleStartGame(clientId, payload);
        break;
      default:
        sendToClient(clientId, { type: 'error', message: 'Unknown message type' });
    }
  }

  // ルーム参加
  function handleJoinRoom(clientId, payload) {
    const { roomId, playerName } = payload;
    const client = clients.get(clientId);
    if (!client) return;

    client.rooms.add(roomId);

    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        players: [],
        gameState: { timeLeft: 180, isActive: false },
        problemSequence: generateProblemSequence(),
        currentProblemIndex: 0,
        waitingCountdown: null,
        startCountdown: null,
        waitingTimer: null
      });
    }

    const room = gameRooms.get(roomId);
    const existingPlayer = room.players.find(p => p.clientId === clientId);
    
    if (!existingPlayer) {
      const currentProblem = room.problemSequence[room.currentProblemIndex];
      room.players.push({
        clientId,
        name: playerName,
        score: 0,
        correct: 0,
        wrong: 0,
        skip: 0,
        currentNumbers: currentProblem.numbers,
        problemIndex: room.currentProblemIndex
      });
    }

    sendToClient(clientId, {
      type: 'room-joined',
      payload: { roomId, players: room.players, gameState: room.gameState }
    });

    broadcastToRoom(roomId, {
      type: 'player-joined',
      payload: { players: room.players }
    }, clientId);

    // 自動開始チェック
    checkAutoStart(roomId);
  }

  // 答え提出
  function handleSubmitAnswer(clientId, payload) {
    const { roomId, formula } = payload;
    const room = gameRooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.clientId === clientId);
    if (!player) return;

    try {
      const isValidNumbers = validateNumbersUsage(formula, player.currentNumbers);
      if (!isValidNumbers) {
        sendToClient(clientId, {
          type: 'answer-result',
          payload: { success: false, message: '指定された数字のみを使用してください' }
        });
        return;
      }

      const result = evaluateFormula(formula);
      const isCorrect = Math.abs(result - 10) < 1e-10;
      
      if (isCorrect) {
        player.score += 10;
        player.correct += 1;
        advancePlayer(player, room);
        
        sendToClient(clientId, {
          type: 'answer-result',
          payload: {
            success: true,
            isCorrect: true,
            message: '正解！',
            newNumbers: player.currentNumbers
          }
        });
      } else {
        player.wrong += 1;
        sendToClient(clientId, {
          type: 'answer-result',
          payload: {
            success: true,
            isCorrect: false,
            message: `不正解... ${formula} = ${result}`
          }
        });
      }

      broadcastToRoom(roomId, {
        type: 'players-updated',
        payload: { players: room.players }
      });

    } catch {
      sendToClient(clientId, {
        type: 'answer-result',
        payload: { success: false, message: '数式が正しくありません' }
      });
    }
  }

  // スキップ
  function handleSkipProblem(clientId, payload) {
    const { roomId } = payload;
    const room = gameRooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.clientId === clientId);
    if (!player) return;

    player.skip += 1;
    player.score = Math.max(0, player.score - 3);
    advancePlayer(player, room);

    sendToClient(clientId, {
      type: 'skip-result',
      payload: {
        newNumbers: player.currentNumbers,
        message: 'スキップしました（-3pt）'
      }
    });

    broadcastToRoom(roomId, {
      type: 'players-updated',
      payload: { players: room.players }
    });
  }

  // プレイヤーを次の問題に進める
  function advancePlayer(player, room) {
    player.problemIndex += 1;
    if (player.problemIndex < room.problemSequence.length) {
      const nextProblem = room.problemSequence[player.problemIndex];
      player.currentNumbers = nextProblem.numbers;
    } else {
      player.problemIndex = 0;
      const firstProblem = room.problemSequence[0];
      player.currentNumbers = firstProblem.numbers;
    }
  }

  // ゲーム開始
  function handleStartGame(clientId, payload) {
    const { roomId } = payload;
    const room = gameRooms.get(roomId);
    if (!room || room.gameState.isActive) return;

    // カウントダウンをキャンセル
    if (room.waitingTimer) {
      clearInterval(room.waitingTimer);
      room.waitingTimer = null;
    }
    room.waitingCountdown = null;
    room.startCountdown = null;
    
    startGameForRoom(roomId);
  }

  // 自動開始チェック
  function checkAutoStart(roomId) {
    const room = gameRooms.get(roomId);
    if (!room || room.gameState.isActive) return;

    if (room.players.length === 4) {
      if (room.waitingTimer) {
        clearInterval(room.waitingTimer);
        room.waitingTimer = null;
      }
      room.waitingCountdown = null;
      startCountdown(roomId, 3);
    } else if (room.players.length === 2 && !room.waitingCountdown) {
      room.waitingCountdown = 30;
      broadcastToRoom(roomId, {
        type: 'waiting-countdown-start',
        payload: { countdown: 30 }
      });
      
      room.waitingTimer = setInterval(() => {
        room.waitingCountdown -= 1;
        broadcastToRoom(roomId, {
          type: 'waiting-countdown-update',
          payload: { countdown: room.waitingCountdown }
        });
        
        if (room.waitingCountdown <= 0) {
          clearInterval(room.waitingTimer);
          room.waitingTimer = null;
          room.waitingCountdown = null;
          startCountdown(roomId, 3);
        }
      }, 1000);
    }
  }

  // カウントダウン
  function startCountdown(roomId, seconds) {
    const room = gameRooms.get(roomId);
    if (!room) return;

    room.startCountdown = seconds;
    broadcastToRoom(roomId, {
      type: 'start-countdown-begin',
      payload: { countdown: seconds }
    });
    
    const timer = setInterval(() => {
      room.startCountdown -= 1;
      broadcastToRoom(roomId, {
        type: 'start-countdown-update',
        payload: { countdown: room.startCountdown }
      });
      
      if (room.startCountdown <= 0) {
        clearInterval(timer);
        room.startCountdown = null;
        startGameForRoom(roomId);
      }
    }, 1000);
  }

  // ゲーム開始
  function startGameForRoom(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;

    room.gameState.isActive = true;
    room.gameState.timeLeft = 180;
    
    // 全プレイヤーをリセット
    const firstProblem = room.problemSequence[0];
    room.players.forEach(player => {
      player.problemIndex = 0;
      player.currentNumbers = firstProblem.numbers;
    });

    broadcastToRoom(roomId, {
      type: 'game-started',
      payload: { gameState: room.gameState }
    });

    // ゲームタイマー
    const gameTimer = setInterval(() => {
      room.gameState.timeLeft -= 1;
      broadcastToRoom(roomId, {
        type: 'time-update',
        payload: { timeLeft: room.gameState.timeLeft }
      });

      if (room.gameState.timeLeft <= 0) {
        clearInterval(gameTimer);
        room.gameState.isActive = false;
        
        const finalPlayers = room.players.map(p => ({
          name: p.name,
          score: p.score,
          correct: p.correct,
          wrong: p.wrong,
          skip: p.skip
        }));

        broadcastToRoom(roomId, {
          type: 'game-ended',
          payload: { players: finalPlayers, roomId, gameTime: 180 }
        });
      }
    }, 1000);
  }

  // 切断処理
  function handleDisconnect(clientId) {
    const client = clients.get(clientId);
    if (!client) return;

    // 全ルームからプレイヤーを削除
    client.rooms.forEach(roomId => {
      const room = gameRooms.get(roomId);
      if (room) {
        const playerIndex = room.players.findIndex(p => p.clientId === clientId);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          
          broadcastToRoom(roomId, {
            type: 'player-left',
            payload: { playerName: player.name, players: room.players }
          });

          if (room.players.length === 0) {
            gameRooms.delete(roomId);
          }
        }
      }
    });

    clients.delete(clientId);
  }

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
  });
});
