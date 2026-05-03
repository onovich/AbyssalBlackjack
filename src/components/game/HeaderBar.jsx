import { Coins, Heart } from 'lucide-react';

export function HeaderBar({ hp, maxHp, coins, stage, maxStages }) {
  return (
    <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-sm mb-4 shadow-lg">
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">
          <Heart size={18} className={hp === 1 ? 'animate-pulse' : ''} /> {hp}/{maxHp}
        </div>
        <div className="flex items-center gap-1.5 font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
          <Coins size={18} /> {coins}
        </div>
      </div>
      <div className="font-black text-indigo-300 tracking-widest text-sm bg-indigo-500/10 px-3 py-1 rounded-lg">
        STAGE {stage}/{maxStages}
      </div>
    </div>
  );
}