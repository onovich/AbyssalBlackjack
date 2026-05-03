import { ArrowRight, Coins, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Card } from './Card';

export function ShopScreen({ shopOffers, coins, hp, maxHp, totalCards, pDeck, pDiscard, isRemoving, onBuyCard, onHeal, onToggleRemoving, onRemoveCard, onNextStage, nextStageLabel }) {
  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-center gap-2 mb-6 text-xl font-black text-slate-300 border-b border-slate-800 pb-4"><ShoppingCart className="text-yellow-500" /> 深渊黑市</div>

      <div className="space-y-6 flex-1 overflow-y-auto pb-24 px-2">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between"><span>招募强力卡牌 (包含小丑牌)</span><span className="text-yellow-400 flex items-center gap-1">4 <Coins size={14} /></span></h3>
          <div className="flex justify-center gap-4">
            {shopOffers.length > 0 ? shopOffers.map((card, idx) => (
              <button key={idx} onClick={() => onBuyCard(card, idx)} disabled={coins < 4} className="relative group disabled:opacity-40 hover:-translate-y-2 transition-transform">
                <Card card={card} className="shadow-lg" />
              </button>
            )) : <div className="text-slate-600 text-sm py-10 font-bold tracking-widest">已售空</div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onHeal} disabled={coins < 5 || hp >= maxHp} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 disabled:opacity-40 hover:bg-slate-800 transition-all">
            <Heart size={28} className="text-red-500" />
            <div className="font-bold text-slate-200">恢复 1 点生命</div>
            <div className="text-sm text-yellow-500 flex items-center gap-1">5 <Coins size={12} /></div>
          </button>

          <button onClick={onToggleRemoving} disabled={coins < 3 && !isRemoving} className={`border p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${isRemoving ? 'bg-red-950/50 border-red-500/50' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 disabled:opacity-40'}`}>
            <Trash2 size={28} className={isRemoving ? 'text-red-400' : 'text-slate-400'} />
            <div className="font-bold text-slate-200">{isRemoving ? '请在下方选择' : '遗忘一张卡牌'}</div>
            <div className="text-sm text-yellow-500 flex items-center gap-1">3 <Coins size={12} /></div>
          </button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between items-center">
            <span>你的专属牌库 ({totalCards}张)</span>
            {isRemoving && <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded animate-pulse border border-red-500/30">点击移除卡牌</span>}
          </h3>
          <div className="grid grid-cols-5 gap-y-4 gap-x-2 p-4 bg-slate-900/30 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto justify-items-center">
            {[...pDeck, ...pDiscard].map((card, index) => (
              <div key={card.id + index} onClick={() => onRemoveCard(card.id, pDeck.find((entry) => entry.id === card.id) ? 'deck' : 'discard')} className={`scale-[0.6] origin-top -mb-10 ${isRemoving ? 'cursor-pointer hover:ring-8 ring-red-500 rounded-xl hover:-translate-y-4 transition-all' : ''}`}>
                <Card card={card} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-4 flex justify-center pointer-events-none">
        <button onClick={onNextStage} disabled={isRemoving} className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(79,70,229,0.3)] pointer-events-auto active:scale-95">
          进入 第 {nextStageLabel} 层深渊 <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}