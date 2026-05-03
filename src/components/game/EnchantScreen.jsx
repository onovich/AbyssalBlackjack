import { Sparkles } from 'lucide-react';
import { Card } from './Card';

export function EnchantScreen({ selectedEnchant, enchantOptions, onSelectEnchant, onSkip, cards, onApplyEnchant, onBack }) {
  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-6"><h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex justify-center items-center gap-2"><Sparkles /> 魔法附魔</h2></div>

      {!selectedEnchant ? (
        <div className="space-y-4">
          {enchantOptions.map((opt, idx) => (
            <button key={idx} onClick={() => onSelectEnchant(opt)} className="w-full bg-slate-900 border border-slate-700 p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800 hover:border-indigo-500 transition-all text-left group">
              <div className="p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform">{opt.icon}</div>
              <div><div className="font-bold text-lg text-slate-200">{opt.title}</div><div className="text-xs text-slate-500 mt-1">{opt.desc}</div></div>
            </button>
          ))}
          <button onClick={onSkip} className="w-full mt-6 py-4 text-slate-500 font-bold hover:text-white transition-colors">跳过附魔，前往商店</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-xl text-center mb-4 font-bold text-indigo-300 text-sm">
            请选择要附加【{selectedEnchant.title}】的卡牌
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
            <div className="grid grid-cols-4 gap-4 justify-items-center">
              {cards.map((card) => (
                <div key={card.id} onClick={() => onApplyEnchant(card)} className="scale-90 origin-top cursor-pointer">
                  <Card card={card} isSelectable={true} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={onBack} className="mt-4 py-3 bg-slate-800 rounded-xl font-bold">返回重选</button>
        </div>
      )}
    </div>
  );
}