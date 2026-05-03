import { Dices, Scissors, ShieldAlert } from 'lucide-react';

export function Card({ card, className = '', isSelectable = false, onClick }) {
  if (!card) return null;

  if (card.hidden) {
    return (
      <div className={`w-24 h-36 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-xl shadow-lg border-2 border-indigo-500/50 flex items-center justify-center relative transition-all duration-300 ${card.isSliced ? 'opacity-0 scale-50 rotate-[-20deg] translate-y-10 blur-sm pointer-events-none' : ''} ${className}`}>
        <div className="absolute inset-2 border border-indigo-400/20 rounded bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(99,102,241,0.1)_5px,rgba(99,102,241,0.1)_10px)]"></div>
        <div className="text-indigo-400/30"><ShieldAlert size={32} /></div>
        {card.isSliced && <div className="absolute inset-0 flex items-center justify-center z-10"><div className="w-[150%] h-1.5 bg-red-500 rotate-45 shadow-[0_0_15px_red]"></div></div>}
      </div>
    );
  }

  const rankTextSize = card.rank.length > 2 ? 'text-sm' : 'text-lg';

  return (
    <div onClick={onClick} className={`w-24 h-36 bg-slate-50 rounded-xl shadow-xl border-2 border-slate-300 flex flex-col justify-between p-2 select-none relative overflow-hidden transition-all duration-500 ease-out origin-center ${isSelectable ? 'cursor-pointer hover:ring-4 hover:-translate-y-2' : ''} ${card.isSliced ? 'opacity-0 scale-50 rotate-[-20deg] translate-y-10 blur-sm pointer-events-none' : ''} ${className}`}>
      <span className={`font-black leading-none ${rankTextSize} ${card.color}`}>{card.rank}</span>
      <span className={`text-4xl self-center drop-shadow-sm ${card.color}`}>{card.suit}</span>
      <span className={`font-black leading-none self-end rotate-180 ${rankTextSize} ${card.color}`}>{card.rank}</span>

      {card.isScissor && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 opacity-20 pointer-events-none"><Scissors size={48} /></div>}
      {card.isScissor && <div className="absolute bottom-1 right-1 text-red-600 bg-white rounded-full p-0.5 shadow-sm border border-red-200"><Scissors size={14} /></div>}
      {card.isJoker && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-500 opacity-20 pointer-events-none"><Dices size={48} /></div>}

      {card.isSliced && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-[150%] h-1.5 bg-red-500 rotate-45 shadow-[0_0_15px_red]"></div>
        </div>
      )}
    </div>
  );
}