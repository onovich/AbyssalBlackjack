import { Coins, RefreshCw, Sparkles } from 'lucide-react';

export function EndScreen({ gameState, stage, coins, totalCards, onRestart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-500 z-50 bg-slate-950/80 backdrop-blur-sm absolute inset-0">
      <div className="text-center">
        {gameState === 'WIN' ? (
          <><Sparkles size={64} className="text-yellow-400 mx-auto mb-6 animate-pulse" /><h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-2xl mb-4">通关</h2><p className="text-slate-300 font-bold tracking-widest">你战胜了深渊的最底层</p></>
        ) : (
          <><h2 className="text-6xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] mb-4">死亡</h2><p className="text-slate-400 font-bold tracking-widest">生命耗尽，止步于 第 {stage} 层</p></>
        )}
      </div>

      <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-700 text-center space-y-4 min-w-[280px] backdrop-blur-md">
        <div className="text-xs text-slate-500 tracking-widest font-bold mb-2">最终统计</div>
        <div className="flex justify-between items-center text-lg border-b border-slate-800 pb-2"><span className="text-slate-300">携带金币</span><span className="font-black text-yellow-400 flex items-center gap-1">{coins} <Coins size={18} /></span></div>
        <div className="flex justify-between items-center text-lg border-b border-slate-800 pb-2"><span className="text-slate-300">牌库规模</span><span className="font-black text-white">{totalCards} 张</span></div>
        <div className="flex justify-between items-center text-lg"><span className="text-slate-300">抵达层数</span><span className="font-black text-indigo-400">STAGE {stage}</span></div>
      </div>

      <button onClick={onRestart} className="px-10 py-4 bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 rounded-full font-black text-lg flex items-center gap-3 active:scale-95 text-white">
        <RefreshCw size={22} /> 再来一局
      </button>
    </div>
  );
}