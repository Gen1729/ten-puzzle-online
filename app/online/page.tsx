'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
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
    myNumbers,
    waitingCountdown,
    startCountdown
  } = useSocket();

  const [playerName, setPlayerName] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [formula, setFormula] = useState('');
  const [usedNumbers, setUsedNumbers] = useState<boolean[]>([false, false, false, false]);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [gameEnded] = useState(false);
  const [finalResults] = useState<{ name: string; score: number }[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('playerName');
      if (savedName) {
        setPlayerName(savedName);
      }
    }
  }, []);

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setErrorMessage('プレイヤー名を入力してください');
      return;
    }
    if (!currentRoomId.trim()) {
      setErrorMessage('ルームIDを入力してください');
      return;
    }

    if (!isConnected) {
      setErrorMessage('サーバーに接続されていません');
      return;
    }

    setErrorMessage('');
    joinRoom(currentRoomId, playerName);
    setHasJoinedRoom(true);
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setErrorMessage('プレイヤー名を入力してください');
      return;
    }

    if (!isConnected) {
      setErrorMessage('サーバーに接続されていません');
      return;
    }

    const newRoomId = uuidv4().slice(0, 8);
    setCurrentRoomId(newRoomId);
    setErrorMessage('');
    joinRoom(newRoomId, playerName);
    setHasJoinedRoom(true);
  };

  const handleNumberClick = (numberIndex: number) => {
    if (usedNumbers[numberIndex]) return;

    const number = myNumbers[numberIndex];
    setFormula(prev => prev + number.toString());
    setUsedNumbers(prev => {
      const newUsed = [...prev];
      newUsed[numberIndex] = true;
      return newUsed;
    });
  };

  const handleOperatorClick = (operator: string) => {
    setFormula(prev => prev + operator);
  };

  const handleParenthesesClick = (paren: string) => {
    setFormula(prev => prev + paren);
  };

  const handleBackspace = () => {
    if (formula.length === 0) return;

    const lastChar = formula[formula.length - 1];
    
    if (!isNaN(parseInt(lastChar))) {
      const lastNumber = parseInt(lastChar);
      const numberIndex = myNumbers.findIndex((num, idx) => 
        num === lastNumber && usedNumbers[idx]
      );
      
      if (numberIndex !== -1) {
        setUsedNumbers(prev => {
          const newUsed = [...prev];
          newUsed[numberIndex] = false;
          return newUsed;
        });
      }
    }
    
    setFormula(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setFormula('');
    setUsedNumbers([false, false, false, false]);
  };

  const handleSubmit = () => {
    if (!formula.trim()) {
      setResultMessage('数式を入力してください');
      return;
    }

    if (!roomId) {
      setResultMessage('ルームに参加していません');
      return;
    }

    try {
      const result = ArithmeticParser.evaluateToNumber(formula);
      
      submitAnswer(roomId, formula);
      handleClear();
      
      if (Math.abs(result - 10) < 1e-10) {
        setResultMessage('正解！');
      } else {
        setResultMessage(`不正解... ${formula} = ${result}`);
      }
    } catch {
      setResultMessage('数式が正しくありません');
    }

    setTimeout(() => setResultMessage(''), 3000);
  };

  const handleSkip = () => {
    if (!roomId) {
      setResultMessage('ルームに参加していません');
      return;
    }

    skipProblem(roomId);
    handleClear();
    setResultMessage('スキップしました（-3pt）');
    setTimeout(() => setResultMessage(''), 3000);
  };

  const handleStartGame = () => {
    if (!roomId) return;
    startGame(roomId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goToResults = () => {
    if (roomId && finalResults.length > 0) {
      const resultsData = encodeURIComponent(JSON.stringify({
        players: finalResults,
        roomId,
        gameTime: 180
      }));
      router.push(`/ranking?data=${resultsData}`);
    }
  };

  if (!hasJoinedRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-16">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
              オンライン対戦
            </h1>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プレイヤー名
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="プレイヤー名を入力"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ルームID
                </label>
                <input
                  type="text"
                  value={currentRoomId}
                  onChange={(e) => setCurrentRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ルームIDを入力"
                />
              </div>

              {errorMessage && (
                <div className="text-red-600 text-sm text-center">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleJoinRoom}
                  disabled={!isConnected}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnected ? 'ルームに参加' : '接続中...'}
                </button>

                <button
                  onClick={handleCreateRoom}
                  disabled={!isConnected}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnected ? '新しいルームを作成' : '接続中...'}
                </button>
              </div>

              <div className="text-center text-sm text-gray-600">
                接続状態: {isConnected ? '✅ 接続済み' : '❌ 未接続'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
              🎉 ゲーム終了！
            </h1>
            
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-600">
                お疲れ様でした！
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={goToResults}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  結果を見る
                </button>
                
                <div>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    ホームに戻る
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ゲーム情報ヘッダー */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap">
            <div className="mb-2 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-800">オンライン対戦</h1>
              <p className="text-gray-600">ルーム: {roomId || 'N/A'}</p>
            </div>
            <div className="text-right">
              {gameState?.isActive ? (
                <div className="text-3xl font-bold text-blue-600">
                  ⏰ {formatTime(gameState.timeLeft)}
                </div>
              ) : (
                <div className="text-lg text-gray-600">
                  待機中...
                </div>
              )}
            </div>
            {!gameState?.isActive && players.length >= 2 && !waitingCountdown && !startCountdown && (
              <div className="w-full mt-4">
                <button
                  onClick={handleStartGame}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  ゲーム開始
                </button>
              </div>
            )}
            {!gameState?.isActive && players.length < 2 && !waitingCountdown && !startCountdown && (
              <div className="text-gray-500">
                プレイヤーを待機中...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* メインゲームエリア */}
          <div className="lg:col-span-3">
            {/* 待機中またはカウントダウン中の表示 */}
            {(waitingCountdown !== null || startCountdown !== null || (!gameState?.isActive && players.length < 2)) && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
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
                <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                  <h2 className="text-lg font-semibold mb-4 text-center">以下の数字を使って10を作ろう！</h2>
                  <div className="flex justify-center space-x-4 mb-6">
                    {myNumbers.length > 0 ? myNumbers.map((number, index) => (
                      <div key={index} className="text-4xl font-bold text-blue-600 bg-blue-100 rounded-lg p-4 min-w-[80px] text-center">
                        {number}
                      </div>
                    )) : [1, 2, 3, 4].map((number, index) => (
                      <div key={index} className="text-4xl font-bold text-gray-400 bg-gray-100 rounded-lg p-4 min-w-[80px] text-center">
                        ?
                      </div>
                    ))}
                  </div>
                </div>

                {/* 入力エリア */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                  <div className="mb-4">
                    <div className="bg-gray-100 rounded-lg p-4 text-5xl font-mono min-h-[80px] flex items-center">
                      {formula || ''}
                    </div>
                    
                    {/* メッセージ表示エリア（常に表示・固定サイズ） */}
                    <div className="mt-3 h-14 flex items-center">
                      {(resultMessage || errorMessage) ? (
                        <div className={`w-full h-full border rounded-lg p-3 flex items-center ${
                          (resultMessage.includes('正解！') || resultMessage.includes('+10pt')) && !resultMessage.includes('不正解')
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : resultMessage.includes('スキップ') || resultMessage.includes('-3pt')
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                            : 'bg-red-100 border-red-300 text-red-700'
                        }`}>
                          <span className="text-lg mr-2 flex-shrink-0">
                            {((resultMessage.includes('正解！') || resultMessage.includes('+10pt')) && !resultMessage.includes('不正解')) ? '✅' : 
                             (resultMessage.includes('スキップ') || resultMessage.includes('-3pt')) ? '⏭️' : '❌'}
                          </span>
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{resultMessage || errorMessage}</span>
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
                            onClick={() => handleNumberClick(index)}
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
                            onClick={() => handleParenthesesClick(op)}
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
                        onClick={handleBackspace}
                        disabled={!gameState?.isActive}
                        className={`px-5 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                          gameState?.isActive
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        削除(BS)
                      </button>
                    </div>

                    {/* 送信・スキップボタン */}
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSubmit}
                        disabled={!gameState?.isActive}
                        className={`flex-1 py-4 text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                          gameState?.isActive
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        送信 (Enter)
                      </button>
                      <button
                        onClick={handleSkip}
                        disabled={!gameState?.isActive}
                        className={`px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                          gameState?.isActive
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        スキップ (-3pt)
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* プレイヤー一覧サイドバー */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                プレイヤー ({players.length}/4)
              </h2>
              
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${
                      player.name === playerName 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 text-sm">
                        {player.name}
                        {player.name === playerName && ' (あなた)'}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {player.score}pt
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      正解: {player.correct} / 不正解: {player.wrong} / スキップ: {player.skip}
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
