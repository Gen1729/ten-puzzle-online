'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ResultPlayer {
  name: string;
  score: number;
  correct: number;
  wrong: number;
  skip: number;
  rank: number;
}

interface PlayerData {
  name: string;
  score: number;
  correct: number;
  wrong: number;
  skip: number;
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [players, setPlayers] = useState<ResultPlayer[]>([]);
  const [roomId, setRoomId] = useState<string>('');
  const [gameTime, setGameTime] = useState<number>(180);

  // プレイヤーを順位順にソートし、同順位を考慮した順位を計算する関数
  const calculateRankings = (players: PlayerData[]) => {
    // 1. ポイント降順、2. 不正解数昇順、3. スキップ数昇順でソート
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score; // ポイント降順
      if (a.wrong !== b.wrong) return a.wrong - b.wrong; // 不正解数昇順
      return a.skip - b.skip; // スキップ数昇順
    });

    // 同順位を考慮した順位を計算
    const playersWithRank: ResultPlayer[] = [];
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

  useEffect(() => {
    // URLパラメータから結果データを取得
    const playersData = searchParams.get('players');
    const roomIdParam = searchParams.get('roomId');
    const gameTimeParam = searchParams.get('gameTime');

    if (playersData) {
      try {
        const parsedPlayers = JSON.parse(decodeURIComponent(playersData));
        // 新しい順位計算ロジックを使用
        const playersWithRank = calculateRankings(parsedPlayers);
        setPlayers(playersWithRank);
      } catch (error) {
        console.error('Failed to parse players data:', error);
        router.push('/');
      }
    }

    if (roomIdParam) {
      setRoomId(roomIdParam);
    }

    if (gameTimeParam) {
      setGameTime(parseInt(gameTimeParam) || 180);
    }
  }, [searchParams, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}位`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-600 to-amber-800';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg">結果を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            🎉 ゲーム終了！
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            ルーム: {roomId} | ゲーム時間: {formatTime(gameTime)}
          </p>
        </div>

        {/* 結果表示 */}
        <div className="space-y-4 mb-8">
          {players.map((player) => (
            <div
              key={player.name}
              className={`bg-gradient-to-r ${getRankColor(player.rank)} rounded-lg shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl font-bold">
                    {getRankIcon(player.rank)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{player.name}</h3>
                    <p className="text-lg opacity-90">
                      {player.rank === 1 ? 'チャンピオン！' : 
                       player.rank === 2 ? '素晴らしい結果！' :
                       player.rank === 3 ? 'よく頑張りました！' : 'お疲れ様でした！'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{player.score}pt</div>
                  <div className="text-sm opacity-90">
                    正答: {player.correct} | 誤答: {player.wrong} | スキップ: {player.skip}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 統計情報 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            📊 ゲーム統計
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {players.reduce((sum, p) => sum + p.correct, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">総正解数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {players.reduce((sum, p) => sum + p.wrong, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">総誤答数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {players.reduce((sum, p) => sum + p.skip, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">総スキップ数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...players.map(p => p.score))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">最高スコア</div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/online">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl">
              もう一度プレイ
            </button>
          </Link>
          <Link href="/">
            <button className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl">
              ホームに戻る
            </button>
          </Link>
          <button
            onClick={() => {
              const resultText = players.map(p => 
                `${p.rank}位: ${p.name} (${p.score}pt)`
              ).join('\n');
              navigator.clipboard.writeText(`10パズル オンライン対戦結果\nルーム: ${roomId}\n\n${resultText}`);
              alert('結果をクリップボードにコピーしました！');
            }}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            結果をシェア
          </button>
        </div>
      </div>
    </div>
  );
}

// ローディングコンポーネント
function ResultLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg">結果を読み込み中...</p>
      </div>
    </div>
  );
}

// メインコンポーネント
export default function ResultPage() {
  return (
    <Suspense fallback={<ResultLoading />}>
      <ResultContent />
    </Suspense>
  );
}
