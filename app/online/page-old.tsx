'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext-ws';
import { ArithmeticParser } from '../parser/parser';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

export default function OnlineGamePage() {
  const router = useRouter();
  const {
    isConnected,
    joinRoom,
    submitAnswer,
    skipProblem,
    startGame,
    players,
    gameState,
    roomId,
    myNumbers
  } = useSocket();

  const [playerName, setPlayerName] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [formula, setFormula] = useState('');
  const [usedNumbers, setUsedNumbers] = useState<boolean[]>([false, false, false, false]);
  const [errorMessage, setErrorMessage] = useState('');
  const [waitingCountdown, setWaitingCountdown] = useState<number | null>(null);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  // プレイヤーを順位順にソートし、同順位を考慮した順位を計算する関数
  const calculateRankings = (players: Array<{
    socketId: string;
    name: string;
    score: number;
    correct: number;
    wrong: number;
    skip: number;
  }>) => {
    // 1. ポイント降順、2. 不正解数昇順、3. スキップ数昇順でソート
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score; // ポイント降順
      if (a.wrong !== b.wrong) return a.wrong - b.wrong; // 不正解数昇順
      return a.skip - b.skip; // スキップ数昇順
    });

    // 同順位を考慮した順位を計算
    const playersWithRank = [];
    let currentRank = 1;
    
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      
      // 前のプレイヤーと比較して順位を決定
      if (i > 0) {
        const prevPlayer = sortedPlayers[i - 1];
        const isSameRank = (
          player.score === prevPlayer.score &&
          player.wrong === prevPlayer.wrong &&
          player.skip === prevPlayer.skip
        );
        
        if (!isSameRank) {
          currentRank = i + 1;
        }
      }
      
      playersWithRank.push({
        ...player,
        rank: currentRank
      });
    }
    
    return playersWithRank;
  };

  // 括弧の対応をチェックする関数
  const validateBrackets = (formula: string): { isValid: boolean; message: string } => {
    let count = 0;
    for (let i = 0; i < formula.length; i++) {
      if (formula[i] === '(') {
        count++;
      } else if (formula[i] === ')') {
        count--;
        if (count < 0) {
          return { isValid: false, message: '括弧の順序が正しくありません' };
        }
      }
    }
    if (count > 0) {
      return { isValid: false, message: '開き括弧が閉じられていません' };
    }
    return { isValid: true, message: '' };
  };

  // 0除算をチェックする関数
  const checkDivisionByZero = (formula: string): { isValid: boolean; message: string } => {
    // ÷0 または /0 のパターンをチェック
    const patterns = [
      /÷\s*0(?![0-9])/g,  // ÷0（後に数字が続かない）
      /\/\s*0(?![0-9])/g   // /0（後に数字が続かない）
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(formula)) {
        return { isValid: false, message: '0で割ることはできません' };
      }
    }
    return { isValid: true, message: '' };
  };

  // 全ての数字が使用されているかチェックする関数
  const validateAllNumbersUsed = (): { isValid: boolean; message: string } => {
    const allUsed = usedNumbers.every(used => used);
    if (!allUsed) {
      return { isValid: false, message: '全ての数字を使用してください' };
    }
    return { isValid: true, message: '' };
  };

  // スキップ結果、正解結果、ゲーム終了を受信
  useEffect(() => {
    if (!socket) return;

    const handleSkipResult = (data: { message?: string; newNumbers?: number[]; score?: number }) => {
      console.log('Skip result received:', data);
      if (data.message) {
        setErrorMessage(data.message);
        // 3秒後にメッセージをクリア
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      }
    };

    const handleAnswerResult = (data: { success?: boolean; isCorrect?: boolean; message?: string }) => {
      console.log('Answer result received:', data);
      if (!data.success) {
        setErrorMessage(data.message || 'エラーが発生しました');
      } else if (!data.isCorrect) {
        setErrorMessage(data.message || '不正解です');
      } else {
        setErrorMessage('正解！ (+10pt)');
        // 3秒後にメッセージをクリア
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      }
    };

    const handleGameEnded = (data: { 
      players: Array<{
        name: string;
        score: number;
        correct: number;
        wrong: number;
        skip: number;
      }>; 
      roomId: string; 
      gameTime: number;
    }) => {
      console.log('Game ended:', data);
      // リザルト画面に遷移
      const playersParam = encodeURIComponent(JSON.stringify(data.players));
      router.push(`/result?players=${playersParam}&roomId=${data.roomId}&gameTime=${data.gameTime}`);
    };

    socket.on('skip-result', handleSkipResult);
    socket.on('answer-result', handleAnswerResult);
    socket.on('game-ended', handleGameEnded);

    return () => {
      socket.off('skip-result', handleSkipResult);
      socket.off('answer-result', handleAnswerResult);
      socket.off('game-ended', handleGameEnded);
    };
  }, [socket, router]);

  // カウントダウンイベントを処理
  useEffect(() => {
    if (!socket) return;

    const handleWaitingCountdownStart = (data: { countdown: number }) => {
      console.log('Waiting countdown started:', data.countdown);
      setWaitingCountdown(data.countdown);
    };

    const handleWaitingCountdownUpdate = (data: { countdown: number }) => {
      console.log('Waiting countdown update:', data.countdown);
      setWaitingCountdown(data.countdown);
    };

    const handleStartCountdownBegin = (data: { countdown: number }) => {
      console.log('Start countdown began:', data.countdown);
      setWaitingCountdown(null);
      setStartCountdown(data.countdown);
    };

    const handleStartCountdownUpdate = (data: { countdown: number }) => {
      console.log('Start countdown update:', data.countdown);
      setStartCountdown(data.countdown);
      
      if (data.countdown === 0) {
        setStartCountdown(null);
      }
    };

    socket.on('waiting-countdown-start', handleWaitingCountdownStart);
    socket.on('waiting-countdown-update', handleWaitingCountdownUpdate);
    socket.on('start-countdown-begin', handleStartCountdownBegin);
    socket.on('start-countdown-update', handleStartCountdownUpdate);

    return () => {
      socket.off('waiting-countdown-start', handleWaitingCountdownStart);
      socket.off('waiting-countdown-update', handleWaitingCountdownUpdate);
      socket.off('start-countdown-begin', handleStartCountdownBegin);
      socket.off('start-countdown-update', handleStartCountdownUpdate);
    };
  }, [socket]);

  // ルーム参加処理
  const handleJoinRoom = () => {
    if (playerName.trim() && currentRoomId.trim()) {
      joinRoom(currentRoomId, playerName);
      setHasJoinedRoom(true);
    }
  };

  // 新しいルーム作成
  const handleCreateRoom = () => {
    const newRoomId = uuidv4().substring(0, 8);
    setCurrentRoomId(newRoomId);
    if (playerName.trim()) {
      joinRoom(newRoomId, playerName);
      setHasJoinedRoom(true);
    }
  };

  // 数字ボタンクリック処理
  const handleNumberClick = (number: number, index: number) => {
    if (usedNumbers[index]) return;
    
    // 直前の文字が数字かチェック（数字の連続を禁止）
    const lastChar = formula.slice(-1);
    if (lastChar && /[0-9]/.test(lastChar)) {
      setErrorMessage('数字を連続で入力することはできません');
      return;
    }
    
    setFormula(prev => prev + number);
    const newUsedNumbers = [...usedNumbers];
    newUsedNumbers[index] = true;
    setUsedNumbers(newUsedNumbers);
    
    // エラーメッセージをクリア（正常な入力の場合）
    setErrorMessage('');
  };

  // 演算子追加
  const handleOperatorClick = (operator: string) => {
    // 直前の文字が演算子かチェック（演算子の連続を禁止）
    const lastChar = formula.slice(-1);
    if (lastChar && /[+\-×÷*/]/.test(lastChar)) {
      setErrorMessage('演算子を連続で入力することはできません');
      return;
    }
    
    // 数式の最初に演算子を置くことを禁止（マイナス記号以外）
    if (formula.length === 0 && operator !== '-') {
      setErrorMessage('数式の最初に演算子を置くことはできません');
      return;
    }
    
    setFormula(prev => prev + operator);
    
    // エラーメッセージをクリア（正常な入力の場合）
    setErrorMessage('');
  };

  // 括弧ボタンクリック
  const handleBracketClick = (bracket: string) => {
    setFormula(prev => prev + bracket);
    // エラーメッセージをクリア（正常な入力の場合）
    setErrorMessage('');
  };

  // 削除処理
  const handleDelete = () => {
    if (formula.length === 0) return;

    const lastChar = formula[formula.length - 1];
    if (!isNaN(Number(lastChar))) {
      // 数字の場合は使用状態をリセット
      const number = Number(lastChar);
      // 後ろから探して最初に見つかった使用済みの同じ数字をリセット
      for (let i = myNumbers.length - 1; i >= 0; i--) {
        if (myNumbers[i] === number && usedNumbers[i]) {
          const newUsedNumbers = [...usedNumbers];
          newUsedNumbers[i] = false;
          setUsedNumbers(newUsedNumbers);
          break;
        }
      }
    }

    setFormula(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  // クリア処理
  const handleClear = () => {
    setFormula('');
    setUsedNumbers([false, false, false, false]);
    setErrorMessage('');
  };

  // 回答提出
  const handleSubmit = () => {
    if (!roomId || !gameState) return;

    try {
      // メッセージをクリア
      setErrorMessage('');

      // 空の数式の場合は何もしない
      if (!formula.trim()) {
        setErrorMessage('数式を入力してください');
        return;
      }

      console.log('入力された数式:', formula);
      console.log('使用可能な数字:', myNumbers);

      // 全ての数字が使用されているかチェック
      const allNumbersCheck = validateAllNumbersUsed();
      if (!allNumbersCheck.isValid) {
        setErrorMessage(allNumbersCheck.message);
        return;
      }

      // 括弧の対応チェック
      const bracketCheck = validateBrackets(formula);
      if (!bracketCheck.isValid) {
        setErrorMessage(bracketCheck.message);
        return;
      }

      // 0除算チェック
      const divisionCheck = checkDivisionByZero(formula);
      if (!divisionCheck.isValid) {
        setErrorMessage(divisionCheck.message);
        return;
      }

      // 数字の使用チェック
      const isValidNumbers = ArithmeticParser.validateNumbersUsage(formula, myNumbers);
      console.log('数字使用チェック:', isValidNumbers);
      
      if (!isValidNumbers) {
        setErrorMessage('指定された数字のみを使用してください');
        return;
      }

      // ArithmeticParserを使用して数式を計算
      const result = ArithmeticParser.evaluateToNumber(formula);
      console.log('計算結果:', result);
      
      // 結果が10かどうかをチェック（浮動小数点誤差を考慮）
      const isCorrect = Math.abs(result - 10) < 1e-10;
      console.log('10パズル正解:', isCorrect);

      submitAnswer(roomId, formula);

      // フォームリセット
      setFormula('');
      setUsedNumbers([false, false, false, false]);
      setErrorMessage('');

    } catch (error) {
      // 計算エラーの場合
      console.error('パーサーエラー:', error);
      
      // エラーメッセージの詳細化
      let errorMsg = `数式が正しくありません: ${formula}`;
      if (error instanceof Error) {
        if (error.message.includes('0で割る')) {
          errorMsg = '0で割ることはできません';
        } else if (error.message.includes('括弧')) {
          errorMsg = '括弧の対応が正しくありません';
        } else if (error.message.includes('不正な文字')) {
          errorMsg = '使用できない文字が含まれています';
        } else if (error.message.includes('期待されるトークン')) {
          errorMsg = '数式の構文が正しくありません';
        }
      }
      
      setErrorMessage(errorMsg);
    }
  };

  // スキップ処理
  const handleSkip = () => {
    if (!roomId) return;
    
    console.log('Skipping problem...');
    skipProblem(roomId);
    
    // スキップ後のフォームリセット
    setFormula('');
    setUsedNumbers([false, false, false, false]);
  };

  // ゲーム開始
  const handleStartGame = () => {
    if (!roomId) return;
    startGame(roomId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg">サーバーに接続中...</p>
        </div>
      </div>
    );
  }

  if (!hasJoinedRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">オンライン対戦</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">プレイヤー名</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="名前を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ルームID</label>
              <input
                type="text"
                value={currentRoomId}
                onChange={(e) => setCurrentRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ルームIDを入力"
              />
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !currentRoomId.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                ルームに参加
              </button>
              
              <button
                onClick={handleCreateRoom}
                disabled={!playerName.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                新しいルームを作成
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 上部：タイマー、ルーム情報、ゲーム開始ボタン */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-red-600">
              ⏰ {gameState ? formatTime(gameState.timeLeft) : '3:00'}
            </div>
            <div className="text-xl font-semibold">
              ルーム: <span className="text-blue-600">{roomId}</span>
            </div>
            <div className="text-lg">
              {waitingCountdown !== null && (
                <div className="text-yellow-600 font-bold">
                  待機中: {waitingCountdown}秒
                </div>
              )}
              {startCountdown !== null && (
                <div className="text-red-600 font-bold text-3xl animate-pulse">
                  開始まで: {startCountdown}
                </div>
              )}
              {!gameState?.isActive && !waitingCountdown && !startCountdown && players.length >= 2 && (
                <button
                  onClick={handleStartGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  ゲーム開始
                </button>
              )}
              {!gameState?.isActive && players.length < 2 && !waitingCountdown && !startCountdown && (
                <div className="text-gray-500">
                  プレイヤーを待機中...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* メインゲームエリア */}
          <div className="lg:col-span-3">
            {/* 待機中またはカウントダウン中の表示 */}
            {(waitingCountdown !== null || startCountdown !== null || (!gameState?.isActive && players.length < 2)) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
                <div className="text-center py-16">
                  {waitingCountdown !== null && (
                    <>
                      <div className="text-4xl mb-4">⏳</div>
                      <h2 className="text-2xl font-semibold mb-4">ゲーム開始まで</h2>
                      <div className="text-6xl font-bold text-yellow-600 mb-4">{waitingCountdown}</div>
                      <p className="text-gray-600">プレイヤーが揃いました！ゲームが自動で開始されます</p>
                    </>
                  )}
                  {startCountdown !== null && (
                    <>
                      <div className="text-4xl mb-4">🎮</div>
                      <h2 className="text-2xl font-semibold mb-4">開始カウントダウン</h2>
                      <div className="text-8xl font-bold text-red-600 mb-4 animate-pulse">{startCountdown}</div>
                      <p className="text-gray-600">準備はいいですか？</p>
                    </>
                  )}
                  {!gameState?.isActive && players.length < 2 && !waitingCountdown && !startCountdown && (
                    <>
                      <div className="text-4xl mb-4">👥</div>
                      <h2 className="text-2xl font-semibold mb-4">プレイヤーを待機中</h2>
                      <p className="text-gray-600">他のプレイヤーの参加をお待ちください</p>
                      <div className="mt-4 text-lg text-blue-600">
                        現在のプレイヤー数: {players.length}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        2人で自動開始、4人で即座に開始
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ゲーム中の問題表示 */}
            {gameState?.isActive && (
              <>
                {/* 問題表示 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
                  <h2 className="text-lg font-semibold mb-4 text-center">以下の数字を使って10を作ろう！</h2>
                  <div className="flex justify-center space-x-4 mb-6">
                    {myNumbers.length > 0 ? myNumbers.map((number, index) => (
                      <div key={index} className="text-4xl font-bold text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-lg p-4 min-w-[80px] text-center">
                        {number}
                      </div>
                    )) : [1, 2, 3, 4].map((number, index) => (
                      <div key={index} className="text-4xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg p-4 min-w-[80px] text-center">
                        ?
                      </div>
                    ))}
                  </div>
                </div>

                {/* 入力エリア */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
                  <div className="mb-4">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-5xl font-mono min-h-[80px] flex items-center">
                      {formula || ''}
                    </div>
                    
                    {/* メッセージ表示エリア（常に表示・固定サイズ） */}
                    <div className="mt-3 h-14 flex items-center">
                      {errorMessage ? (
                        <div className={`w-full h-full border rounded-lg p-3 flex items-center ${
                          (errorMessage.includes('正解！') || errorMessage.includes('+10pt')) && !errorMessage.includes('不正解')
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : errorMessage.includes('スキップ') || errorMessage.includes('-3pt')
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                            : 'bg-red-100 border-red-300 text-red-700'
                        }`}>
                          <span className="text-lg mr-2 flex-shrink-0">
                            {(errorMessage.includes('正解！') || errorMessage.includes('+10pt')) && !errorMessage.includes('不正解') ? '✅' : 
                             errorMessage.includes('スキップ') || errorMessage.includes('-3pt') ? '⏭️' : '❌'}
                          </span>
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{errorMessage}</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-50 border border-gray-200 text-gray-400 rounded-lg p-3 flex items-center"></div>
                      )}
                    </div>
                  </div>

              {/* ボタン群 */}
              <div className="space-y-4">
                {/* 数字ボタン */}
                <div>
                  <div className="flex space-x-2">
                    {myNumbers.length > 0 ? myNumbers.map((number, index) => (
                      <button
                        key={index}
                        onClick={() => handleNumberClick(number, index)}
                        disabled={usedNumbers[index] || !gameState?.isActive}
                        className={`px-6 py-4 text-2xl font-bold rounded-lg transition-colors min-w-[60px] ${
                          usedNumbers[index]
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : gameState?.isActive
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {number}
                      </button>
                    )) : [1, 2, 3, 4].map((number, index) => (
                      <button
                        key={index}
                        disabled={true}
                        className="px-6 py-4 text-2xl font-bold rounded-lg transition-colors min-w-[60px] bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        ?
                      </button>
                    ))}
                  </div>
                </div>

                {/* 記号ボタン */}
                <div>
                  <div className="flex space-x-2">
                    {['+', '-', '×', '÷'].map((op) => (
                      <button
                        key={op}
                        onClick={() => handleOperatorClick(op)}
                        disabled={!gameState?.isActive}
                        className={`px-6 py-4 text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-colors min-w-[60px] ${
                          gameState?.isActive
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                    {['(', ')'].map((op) => (
                      <button
                        key={op}
                        onClick={() => handleBracketClick(op)}
                        disabled={!gameState?.isActive}
                        className={`px-6 py-4 text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-colors min-w-[60px] ${
                          gameState?.isActive
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 操作ボタン */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleClear}
                    disabled={!gameState?.isActive}
                    className={`px-5 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                      gameState?.isActive
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    クリア(C)
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={!gameState?.isActive}
                    className={`px-5 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                      gameState?.isActive
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    削除(⌫)
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={!gameState?.isActive}
                    className={`px-5 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                      gameState?.isActive
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    スキップ(⏭)
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!gameState?.isActive || !formula}
                    className={`px-6 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors font-bold ${
                      gameState?.isActive && formula
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    送信(✔)
                  </button>
                </div>
              </div>
            </div>
              </>
            )}
          </div>

          {/* 右側：プレイヤー状況 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">プレイヤー状況</h3>
              <div className="space-y-3">
                {calculateRankings(players).map((player) => (
                  <div key={player.socketId} className={`p-3 rounded-lg border ${player.name === playerName ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} dark:bg-gray-700 dark:border-gray-600`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{player.name}</span>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{player.rank}位</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>スコア: <span className="font-bold text-blue-600">{player.score}</span></div>
                      <div className="flex justify-between">
                        <span>正答: <span className="text-green-600">{player.correct}</span></span>
                        <span>誤答: <span className="text-red-600">{player.wrong}</span></span>
                        <span>スキップ: <span className="text-orange-600">{player.skip}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
