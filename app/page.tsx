import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* タイトル */}
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white">
            10
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-600 dark:text-gray-300">
            Puzzle Online
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            数字を組み合わせて10を作ろう！
          </p>
        </div>

        {/* ボタン群 */}
        <div className="space-y-4">
          {/* プレイ開始ボタン */}
          <Link href="/solo">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
              ソロプレイ
            </button>
          </Link>

          {/* オンライン対戦ボタン */}
          <Link href="/online">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 my-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
              オンライン対戦
            </button>
          </Link>

          {/* ランキングページボタンとルールボタン */}
          <div className="flex space-x-3">
            <Link href="/ranking" className="flex-1">
              <button className="w-full bg-red-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 border border-gray-300 dark:border-gray-600">
                ランキング
              </button>
            </Link>

            <Link href="/rule" className="flex-1">
              <button className="w-full bg-green-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 border border-gray-300 dark:border-gray-600">
                遊び方
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}