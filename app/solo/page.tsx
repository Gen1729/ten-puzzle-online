'use client';

import { useState, useEffect } from 'react';
import { ArithmeticParser } from '../parser/parser';
import { useRouter } from 'next/navigation';
import easyProblems from '@/puzzledata/easy';
import normalProblems from '@/puzzledata/normal';
import difficultProblems from '@/puzzledata/difficult';

// 問題データ（オンライン対戦と同じ）
// const easyProblems = [
//   '1124', '1223', '1478', '2468', '0446', '1118', '1355', '2466',
//   '1258', '2378', '0255', '1268', '2888', '3337', '3777', '4666',
//   '1227', '4446', '1135', '1467', '1678', '2555', '3579', '3678',
//   '4589', '5689', '2459', '2589', '1579', '2346', '2348', '2789',
//   '1348', '4789', '0379', '2225', '3568', '0289', '1224', '2228',
//   '1357', '2347', '4567', '0055', '0238', '0456', '1126', '1249',
//   '2479', '4578', '2369', '3469', '2569', '0234', '1267', '0118',
//   '0244', '0334', '1899', '1999', '0355', '1225', '3458', '1256',
//   '3569', '1156', '1334', '0258', '1138', '1147', '1244', '3689',
//   '0356', '0458', '1155', '5678', '2356', '1568', '2457', '1238',
//   '2349', '0268', '2679', '1129', '1368', '2567', '1236', '1247',
//   '1578', '1468', '2566', '2599', '3447', '3667', '3799', '4699',
//   '1257', '2899', '3557', '3788', '2558', '2577', '2588', '2778',
//   '4556', '4677', '1367', '2237', '3346', '2445', '0138', '0147',
//   '0156', '0239', '0349', '0358', '0459', '0569', '0578', '0679',
//   '0789', '1358', '1789', '2335', '2338', '4688', '1349', '1679',
//   '1229', '1339', '1449', '1559', '1779', '1889', '1239', '1569',
//   '1669', '2345', '1119', '1459', '2448', '1226', '1136', '2668',
//   '0025', '1127', '1248', '0226', '0155', '1145', '1356', '3456',
//   '2246', '0019', '0028', '0037', '0046', '0257', '0127', '0129',
//   '0136', '0145', '0367', '0468', '0245', '1125', '1235', '1128',
//   '1137', '1146', '1458', '0248', '1234', '0235', '1245', '0119',
//   '0125', '0128', '0137', '0146'
// ];

// const normalProblems = [
//   '1457', '0455', '0555', '0556', '0558', '1133', '1139', '1144',
//   '1157', '1799', '2248', '2249', '2446', '2447', '2455', '3459',
//   '3556', '4689', '2444', '5555', '0115', '1255', '1289', '1557',
//   '2269', '2288', '2368', '2578', '2699', '2799', '2889', '3347',
//   '3599', '3699', '4599', '0133', '0229', '0267', '0339', '0449',
//   '0488', '0669', '0779', '0889', '0999', '1377', '2256', '3379',
//   '0247', '1148', '1379', '1488', '2469', '2788', '3356', '3578',
//   '3677', '3778', '4566', '1588', '4667', '2244', '2389', '4557',
//   '2579', '3668', '0126', '0135', '0227', '0249', '0568', '0579',
//   '1246', '2224', '2233', '2556', '1345', '2456', '1369', '2247',
//   '2366', '1456', '2488', '2234', '2478', '2678', '2689', '4568',
//   '1344', '1788', '2259', '3348', '3889', '4457', '4479', '4778',
//   '5667', '5779', '6679', '3479', '2268', '2467', '3445', '4458',
//   '1228', '1233', '2238', '1335', '2379', '2236', '2489', '3345',
//   '4468', '1577', '2568', '3455', '1366', '2677', '3359', '0225',
//   '0256', '0259', '1237', '3468', '3589', '3566', '2337', '4456',
//   '2344', '2239', '0139', '0149', '0159', '0169', '0179', '0189',
//   '0199', '0228', '0237', '0246', '0278', '0288', '0337', '0346',
//   '0347', '0357', '0377', '0378', '0466', '0467', '0469', '1477',
//   '1688', '1689', '2258', '3457', '2458', '1359', '2359', '2357',
//   '3567', '0124', '0223', '0559', '1469', '0224', '3489', '4455',
//   '5566', '5577', '5588', '5599', '0368', '0557', '3446', '2336',
//   '4678', '1266', '3355', '2255', '0266', '0477', '0688', '0899'
// ];

// const difficultProblems = [
//   '1158', '1116', '1149', '1167', '1189', '2289', '2666', '3333',
//   '3357', '3366', '3377', '3478', '3577', '3588', '4466', '4467',
//   '4559', '5557', '7778', '7899', '8888', '8999', '9999', '1277',
//   '4888', '5889', '6678', '6779', '1114', '1168', '1199', '1337',
//   '1388', '1555', '1566', '1599', '3344', '3466', '4449', '4679',
//   '5559', '5679', '5778', '6889', '7779', '7889', '8889', '1269',
//   '6688', '6689', '6799', '1336', '2299', '2477', '3555', '4779',
//   '6788', '1479', '1288', '1347', '1445', '1447', '2222', '2279',
//   '2333', '2339', '2399', '2669', '2999', '3334', '3339', '3449',
//   '3477', '3488', '3558', '3888', '4447', '4448', '4777', '4788',
//   '4889', '5669', '5699', '5777', '5888', '5999', '1378', '2278',
//   '1389', '2266', '2367', '3335', '3499', '3559', '5677', '1279',
//   '1778', '1888', '2226', '2334', '2358', '2499', '2557', '2777',
//   '3336', '3338', '3349', '3367', '4478', '4569', '5558', '5568',
//   '6669', '1489', '2388', '3389', '3679', '5688', '3368', '3399',
//   '1166', '2688', '4499', '1222', '1338', '1466', '1556', '1668',
//   '3378', '3467', '3899', '4669', '4799', '5578', '5666', '6699',
//   '2355', '3388', '4668', '6668', '1134', '1299', '1455', '2227',
//   '2229', '4489', '4577', '2277', '3666', '1117', '1259', '1346',
//   '1567', '2779', '4445', '4488', '4588', '5556', '5579', '5589',
//   '1589', '6789', '2377', '3369', '4469', '5569', '2235', '1123',
//   '1278', '1333', '1446', '2223', '2245', '2267', '2449', '3688',
//   '2559', '5789', '3358', '1115', '1448', '1558', '2667', '3448',
//   '3789', '4555', '4579', '5567'
// ];

// 問題文字列を数字配列に変換する関数
const convertProblemToNumbers = (problemStr: string): number[] => {
  return problemStr.split('').map(char => parseInt(char));
};

// ゲーム用の問題シーケンスを生成する関数（オンライン対戦と同じ）
const generateProblemSequence = (count = 90) => {
  const sequence = [];
  const difficulties = [
    { name: 'easy', problems: [...easyProblems], usedProblems: new Set() },
    { name: 'normal', problems: [...normalProblems], usedProblems: new Set() },
    { name: 'difficult', problems: [...difficultProblems], usedProblems: new Set() }
  ];
  
  for (let i = 0; i < count; i++) {
    const difficultyIndex = i % 3; // easy -> normal -> difficult の順でローテーション
    const difficultyData = difficulties[difficultyIndex];
    
    // 使用可能な問題をフィルタリング
    const availableProblems = difficultyData.problems.filter(
      problem => !difficultyData.usedProblems.has(problem)
    );
    
    if (availableProblems.length === 0) {
      // 使用可能な問題がない場合はリセット
      difficultyData.usedProblems.clear();
      availableProblems.push(...difficultyData.problems);
    }
    
    // ランダムに問題を選択
    const randomIndex = Math.floor(Math.random() * availableProblems.length);
    const selectedProblem = availableProblems[randomIndex];
    
    // 選択した問題を使用済みとしてマーク
    difficultyData.usedProblems.add(selectedProblem);
    
    // 問題オブジェクトを追加
    sequence.push({
      numbers: convertProblemToNumbers(selectedProblem),
      difficulty: difficultyData.name,
      originalProblem: selectedProblem
    });
  }
  
  return sequence;
};

export default function SoloGamePage() {
  const router = useRouter();

  // State管理
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'playing' | 'finished'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(180); // 3分 = 180秒
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);

  // 問題管理
  interface Problem {
    numbers: number[];
    difficulty: string;
    originalProblem: string;
  }
  
  const [problemSequence, setProblemSequence] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);

  // UI状態
  const [usedNumbers, setUsedNumbers] = useState<boolean[]>([false, false, false, false]);
  const [formula, setFormula] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    const patterns = [
      /÷\s*0(?![0-9])/g,
      /\/\s*0(?![0-9])/g
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(formula)) {
        return { isValid: false, message: '0で割ることはできません' };
      }
    }
    return { isValid: true, message: '' };
  };

  // 全ての数字が使用されているかチェック
  const validateAllNumbersUsed = (): { isValid: boolean; message: string } => {
    const allUsed = usedNumbers.every(used => used);
    if (!allUsed) {
      return { isValid: false, message: '全ての数字を使用してください' };
    }
    return { isValid: true, message: '' };
  };

  // ゲーム初期化
  useEffect(() => {
    const problems = generateProblemSequence();
    setProblemSequence(problems);
    if (problems.length > 0) {
      setCurrentNumbers(problems[0].numbers);
    }
  }, []);

  // カウントダウンとタイマー管理
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('playing');
    }
  }, [gameState, countdown]);

  // ゲーム終了処理
  const handleGameEnd = () => {
    setGameState('finished');
    // リザルト画面に遷移
    const playersData = [{
      name: 'あなた',
      score: score,
      correct: correctCount,
      wrong: wrongCount,
      skip: skipCount
    }];
    const playersParam = encodeURIComponent(JSON.stringify(playersData));
    router.push(`/result?players=${playersParam}&isSolo=true&gameTime=180`);
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      setGameState('finished');
      // リザルト画面に遷移
      const playersData = [{
        name: 'あなた',
        score: score,
        correct: correctCount,
        wrong: wrongCount,
        skip: skipCount
      }];
      const playersParam = encodeURIComponent(JSON.stringify(playersData));
      router.push(`/result?players=${playersParam}&isSolo=true&gameTime=180`);
    }
  }, [gameState, timeLeft, score, correctCount, wrongCount, skipCount, router]);

  // ゲーム開始
  const handleStartGame = () => {
    setGameState('countdown');
    setCountdown(3);
  };

  // 次の問題に進む
  const nextProblem = () => {
    if (currentProblemIndex < problemSequence.length - 1) {
      const nextIndex = currentProblemIndex + 1;
      setCurrentProblemIndex(nextIndex);
      setCurrentNumbers(problemSequence[nextIndex].numbers);
      setFormula('');
      setUsedNumbers([false, false, false, false]);
    } else {
      // 問題が終了した場合
      handleGameEnd();
    }
  };

  // 数字ボタンクリック処理
  const handleNumberClick = (number: number, index: number) => {
    if (usedNumbers[index] || gameState !== 'playing') return;
    
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
    if (gameState !== 'playing') return;
    
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
    if (gameState !== 'playing') return;
    
    setFormula(prev => prev + bracket);
    // エラーメッセージをクリア（正常な入力の場合）
    setErrorMessage('');
  };

  // 削除処理
  const handleDelete = () => {
    if (formula.length === 0 || gameState !== 'playing') return;

    const lastChar = formula[formula.length - 1];
    if (!isNaN(Number(lastChar))) {
      // 数字の場合は使用状態をリセット
      const number = Number(lastChar);
      // 後ろから探して最初に見つかった使用済みの同じ数字をリセット
      for (let i = currentNumbers.length - 1; i >= 0; i--) {
        if (currentNumbers[i] === number && usedNumbers[i]) {
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
    if (gameState !== 'playing') return;
    
    setFormula('');
    setUsedNumbers([false, false, false, false]);
    setErrorMessage('');
  };

  // 回答提出
  const handleSubmit = () => {
    if (gameState !== 'playing') return;

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
        setErrorMessage('正解！ (+10pt)');
        nextProblem();
      } else {
        setWrongCount(prev => prev + 1);
        setErrorMessage(`不正解... ${formula} = ${result} (10ではありません)`);
      }

      // フォームリセット
      setFormula('');
      setUsedNumbers([false, false, false, false]);

      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);

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
    if (gameState !== 'playing') return;
    
    console.log('Skipping problem...');
    setScore(prev => Math.max(0, prev - 3));
    setSkipCount(prev => prev + 1);
    setErrorMessage('スキップしました（-3pt）');
    nextProblem();
    
    // スキップ後のフォームリセット
    setFormula('');
    setUsedNumbers([false, false, false, false]);

    // 3秒後にメッセージをクリア
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  // 待機画面
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            🧮 10パズル ソロモード
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            4つの数字を使って10を作るパズルゲームです。<br/>
            制限時間は3分間です。
          </p>
          <button
            onClick={handleStartGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            ゲーム開始
          </button>
        </div>
      </div>
    );
  }

  // カウントダウン画面
  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-bold text-blue-600 mb-4 animate-pulse">
            {countdown || 'START!'}
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            ゲーム開始まで...
          </p>
        </div>
      </div>
    );
  }

  // プレイ中のUI（online/page.tsxのUIと同じ構造）
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 上部：タイマー、ソロモード表示 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-red-600">
              ⏰ {formatTime(timeLeft)}
            </div>
            <div className="text-xl font-semibold">
              モード: <span className="text-blue-600">ソロプレイ</span>
            </div>
            <div className="text-lg">
              スコア: <span className="text-green-600">{score}</span>
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
                    {currentNumbers.map((number, index) => (
                      <button
                        key={index}
                        onClick={() => handleNumberClick(number, index)}
                        disabled={usedNumbers[index] || gameState !== 'playing'}
                        className={`px-6 py-4 text-2xl font-bold rounded-lg transition-colors min-w-[60px] ${
                          usedNumbers[index]
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : gameState === 'playing'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                        disabled={gameState !== 'playing'}
                        className={`px-6 py-4 text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-colors min-w-[60px] ${
                          gameState === 'playing'
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
                        disabled={gameState !== 'playing'}
                        className={`px-6 py-4 text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-colors min-w-[60px] ${
                          gameState === 'playing'
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
                    disabled={gameState !== 'playing'}
                    className={`px-5 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                      gameState === 'playing'
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    クリア(C)
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={gameState !== 'playing'}
                    className={`px-5 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                      gameState === 'playing'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    削除(⌫)
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={gameState !== 'playing'}
                    className={`px-5 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors ${
                      gameState === 'playing'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    スキップ(⏭)
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={gameState !== 'playing' || !formula}
                    className={`px-6 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-colors font-bold ${
                      gameState === 'playing' && formula
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    送信(✔)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：ゲーム状況 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">ゲーム状況</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="text-center mb-3">
                    <span className="font-semibold text-lg">現在のスコア</span>
                  </div>
                  <div className="text-center mb-3">
                    <span className="text-3xl font-bold text-blue-600">{score}</span>
                    <span className="text-sm text-gray-500 ml-1">pt</span>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>正答数:</span>
                      <span className="font-semibold text-green-600">{correctCount}問</span>
                    </div>
                    <div className="flex justify-between">
                      <span>誤答数:</span>
                      <span className="font-semibold text-red-600">{wrongCount}問</span>
                    </div>
                    <div className="flex justify-between">
                      <span>スキップ数:</span>
                      <span className="font-semibold text-orange-600">{skipCount}問</span>
                    </div>
                    <hr className="my-2 border-gray-300 dark:border-gray-600" />
                    <div className="flex justify-between">
                      <span>回答数:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{correctCount + wrongCount}問</span>
                    </div>
                    {correctCount + wrongCount > 0 && (
                      <div className="flex justify-between">
                        <span>正答率:</span>
                        <span className="font-semibold text-purple-600">
                          {Math.round((correctCount / (correctCount + wrongCount)) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
