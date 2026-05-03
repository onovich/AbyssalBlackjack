import { Dices } from 'lucide-react';
import { Card } from './Card';

export function JokerOverlay({ rollingJoker, handScore, jokerDiceCount, onRoll, onStop }) {
  if (!rollingJoker) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
      <h2 className="text-4xl font-black text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse">小丑的赌局！</h2>
      <div className="scale-[1.5] mb-12 relative shadow-[0_0_50px_rgba(168,85,247,0.3)] rounded-xl">
        <Card card={rollingJoker} />
      </div>
      <div className="text-xl font-bold mb-8 text-slate-300 bg-slate-900/80 px-6 py-2 rounded-full border border-purple-500/30 shadow-lg">
        当前手牌总点数: <span className="text-white text-2xl ml-2">{handScore}</span>
      </div>
      <div className="flex gap-6">
        <button onClick={onRoll} className="px-6 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(168,85,247,0.5)] flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <span className="flex items-center gap-2"><Dices size={24} /> 投掷 {jokerDiceCount} 颗骰子</span>
          <span className="text-xs text-purple-200">可能增加 {jokerDiceCount}~{jokerDiceCount * 6} 点</span>
        </button>
        <button onClick={onStop} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black text-xl flex items-center gap-2 active:scale-95 transition-transform border border-slate-500">
          ✋ 见好就收
        </button>
      </div>
      <p className="mt-8 text-red-400 font-bold bg-red-900/30 px-4 py-2 rounded">警告：随着投掷次数增加，点数极易失控！</p>
    </div>
  );
}