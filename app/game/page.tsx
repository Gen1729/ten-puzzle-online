'use client';

import { useState, useEffect } from 'react';
import { ArithmeticParser } from '../parser/parser';


export default function GamePage() {
  // ゲーム状態管理
  const [timeLeft, setTimeLeft] = useState(180); // 3分 = 180秒
  const [currentNumbers, setCurrentNumbers] = useState([3, 7, 8, 9]);
  const [usedNumbers, setUsedNumbers] = useState<boolean[]>([false, false, false, false]);
  const [formula, setFormula] = useState('');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // プレイヤー情報（仮データ）
  const players = [
    { id: 1, name: 'あなた', score: score, correct: correctCount, wrong: wrongCount, skip: skipCount },
    { id: 2, name: 'プレイヤー2', score: 45, correct: 5, wrong: 1, skip: 2 },
    { id: 3, name: 'プレイヤー3', score: 38, correct: 4, wrong: 2, skip: 1 },
  ].sort((a, b) => b.score - a.score); // スコア順にソート（降順）

  // 自分の順位を計算
  const myRank = players.findIndex(player => player.name === 'あなた') + 1;

  // タイマー機能
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // 時間フォーマット関数
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // 数字ボタンクリック
  const handleNumberClick = (number: number, index: number) => {
    if (!usedNumbers[index]) {
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
    }
  };

  // 演算子ボタンクリック
  const handleOperatorClick = (operator: string) => {
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

  // クリアボタン
  const handleClear = () => {
    setFormula('');
    setUsedNumbers([false, false, false, false]);
    // エラーメッセージをクリア
    setErrorMessage('');
  };

  // 削除ボタン
  const handleDelete = () => {
    if (formula.length > 0) {
      const lastChar = formula[formula.length - 1];
      setFormula(prev => prev.slice(0, -1));
      
      // 数字が削除された場合、使用状態をリセット
      if (!isNaN(parseInt(lastChar))) {
        const numberIndex = currentNumbers.findIndex((num, idx) => 
          num.toString() === lastChar && usedNumbers[idx]
        );
        if (numberIndex !== -1) {
          const newUsedNumbers = [...usedNumbers];
          newUsedNumbers[numberIndex] = false;
          setUsedNumbers(newUsedNumbers);
        }
      }
      
      // エラーメッセージをクリア
      setErrorMessage('');
    }
  };

  // 送信ボタン
  const handleSubmit = () => {
    try {
      // メッセージをクリア
      setErrorMessage('');

      // 空の数式の場合は何もしない
      if (!formula.trim()) {
        setErrorMessage('数式を入力してください');
        return;
      }

      console.log('入力された数式:', formula);
      console.log('使用可能な数字:', currentNumbers);

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
      const isValidNumbers = ArithmeticParser.validateNumbersUsage(formula, currentNumbers);
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
      
      if (isCorrect) {
        setScore(prev => prev + 10);
        setCorrectCount(prev => prev + 1);
        // 新しい問題を生成
        generateNewProblem();
      } else {
        setErrorMessage(`不正解... ${formula} = ${result} (10ではありません)`);
      }
      handleClear();
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
      handleClear();
    }
  };

  // スキップボタン
  const handleSkip = () => {
    setScore(prev => prev - 3);
    setSkipCount(prev => prev + 1);
    generateNewProblem();
    handleClear();
  };

  // 新しい問題を生成（仮実装）
  const generateNewProblem = () => {
    const newNumbers = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];
    setCurrentNumbers(newNumbers);
    
    // 新しい問題になったらメッセージをクリア
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 上部：タイマー、スコア、順位 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-red-600">
              ⏰ {formatTime(timeLeft)}
            </div>
            <div className="text-xl font-semibold">
              スコア: <span className="text-blue-600">{score}</span>
            </div>
            <div className="text-lg">
              順位: <span className="text-green-600">{myRank}位</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* メインゲームエリア */}
          <div className="lg:col-span-3">
            {/* 問題表示 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4 text-center">以下の数字を使って10を作ろう！</h2>
              <div className="flex justify-center space-x-4 mb-6">
                {currentNumbers.map((number, index) => (
                  <div key={index} className="text-4xl font-bold text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-lg p-4 min-w-[80px] text-center">
                    {number}
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
                    <div className="w-full h-full bg-red-100 border border-red-300 text-red-700 rounded-lg p-3 flex items-center">
                      <span className="text-lg mr-2 flex-shrink-0">❌</span>
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
                    {currentNumbers.map((number, index) => (
                      <button
                        key={index}
                        onClick={() => handleNumberClick(number, index)}
                        disabled={usedNumbers[index]}
                        className={`px-6 py-4 text-2xl font-bold rounded-lg transition-colors min-w-[60px] ${
                          usedNumbers[index]
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {number}
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
                        className="px-6 py-4 text-2xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-colors min-w-[60px]"
                      >
                        {op}
                      </button>
                    ))}
                    {['(', ')'].map((op) => (
                      <button
                        key={op}
                        onClick={() => handleBracketClick(op)}
                        className="px-6 py-4 text-2xl font-bold bg-purple-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-colors min-w-[60px]"
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
                    className="px-5 py-4 text-lg bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-colors"
                  >
                    クリア(C)
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-5 py-4 text-lg bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-colors"
                  >
                    削除(⌫)
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-5 py-4 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-colors"
                  >
                    スキップ(⏭)
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-4 text-lg bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-colors font-bold"
                  >
                    送信(✔)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：プレイヤー状況 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">プレイヤー状況</h3>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div key={player.id} className={`p-3 rounded-lg border ${player.name === 'あなた' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} dark:bg-gray-700 dark:border-gray-600`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{player.name}</span>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{index + 1}位</span>
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