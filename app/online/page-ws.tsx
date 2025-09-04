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
  const [waitingCountdown] = useState<number | null>(null);
  const [startCountdown] = useState<number | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [resultMessageType, setResultMessageType] = useState<'success' | 'error' | 'info'>('info');
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
      setResultMessageType('error');
      return;
    }

    if (!roomId) {
      setResultMessage('ルームに参加していません');
      setResultMessageType('error');
      return;
    }

    try {
      const result = ArithmeticParser.evaluateToNumber(formula);
      
      submitAnswer(roomId, formula);
      handleClear();
      
      if (Math.abs(result - 10) < 1e-10) {
        setResultMessage('正解！');
        setResultMessageType('success');
      } else {
        setResultMessage(`不正解... ${formula} = ${result}`);
        setResultMessageType('error');
      }
    } catch {
      setResultMessage('数式が正しくありません');
      setResultMessageType('error');
    }

    setTimeout(() => setResultMessage(''), 3000);
  };

  const handleSkip = () => {
    if (!roomId) {
      setResultMessage('ルームに参加していません');
      setResultMessageType('error');
      return;
    }

    skipProblem(roomId);
    handleClear();
    setResultMessage('スキップしました（-3pt）');
    setResultMessageType('info');
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
      <div className="max-w-4xl mx-auto">
        {/* ゲーム情報ヘッダー */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">オンライン対戦</h1>
              <p className="text-gray-600">ルーム: {roomId}</p>
            </div>
            <div className="text-right">
              {gameState?.isActive ? (
                <div className="text-2xl font-bold text-blue-600">
                  ⏰ {formatTime(gameState.timeLeft)}
                </div>
              ) : (
                <div className="text-lg text-gray-600">
                  待機中...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* プレイヤー一覧 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
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
                      <span className="font-medium text-gray-800">
                        {player.name}
                        {player.name === playerName && ' (あなた)'}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {player.score}pt
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      正解: {player.correct} / 不正解: {player.wrong} / スキップ: {player.skip}
                    </div>
                  </div>
                ))}
              </div>

              {/* カウントダウン表示 */}
              {waitingCountdown !== null && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-center">
                  <p className="text-yellow-800 font-medium">
                    自動開始まで: {waitingCountdown}秒
                  </p>
                </div>
              )}

              {startCountdown !== null && (
                <div className="mt-4 p-3 bg-red-100 rounded-lg text-center">
                  <p className="text-red-800 font-bold text-lg">
                    ゲーム開始まで: {startCountdown}
                  </p>
                </div>
              )}

              {/* ゲーム開始ボタン */}
              {!gameState?.isActive && players.length >= 2 && (
                <div className="mt-4">
                  <button
                    onClick={handleStartGame}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    ゲーム開始
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ゲーム画面 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {gameState?.isActive ? (
                <>
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    10パズル
                  </h2>

                  {/* 現在の数字 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-gray-700">
                      使用する数字:
                    </h3>
                    <div className="flex gap-3 justify-center">
                      {myNumbers.map((number, index) => (
                        <button
                          key={index}
                          onClick={() => handleNumberClick(index)}
                          disabled={usedNumbers[index]}
                          className={`w-16 h-16 text-2xl font-bold rounded-lg transition-all ${
                            usedNumbers[index]
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 数式入力 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-gray-700">
                      数式:
                    </h3>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-mono h-8 flex items-center justify-center">
                        {formula || '数字と演算子を選択してください'}
                      </div>
                    </div>
                  </div>

                  {/* 演算子 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-gray-700">
                      演算子:
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {['+', '-', '×', '÷'].map((op) => (
                        <button
                          key={op}
                          onClick={() => handleOperatorClick(op)}
                          className="h-12 text-xl font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 括弧 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-gray-700">
                      括弧:
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleParenthesesClick('(')}
                        className="h-12 text-xl font-bold bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        (
                      </button>
                      <button
                        onClick={() => handleParenthesesClick(')')}
                        className="h-12 text-xl font-bold bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        )
                      </button>
                    </div>
                  </div>

                  {/* 制御ボタン */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={handleBackspace}
                      className="h-12 text-lg font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      ← 戻る
                    </button>
                    <button
                      onClick={handleClear}
                      className="h-12 text-lg font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      クリア
                    </button>
                  </div>

                  {/* 送信・スキップボタン */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSubmit}
                      className="h-12 text-lg font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      送信
                    </button>
                    <button
                      onClick={handleSkip}
                      className="h-12 text-lg font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      スキップ (-3pt)
                    </button>
                  </div>

                  {/* 結果メッセージ */}
                  {resultMessage && (
                    <div className={`mt-4 p-3 rounded-lg text-center ${
                      resultMessageType === 'success' ? 'bg-green-100 text-green-800' :
                      resultMessageType === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {resultMessage}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    ゲーム待機中
                  </h2>
                  <p className="text-gray-600">
                    {players.length < 2 
                      ? 'プレイヤーが集まるのを待っています...' 
                      : 'ゲーム開始を待っています...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
