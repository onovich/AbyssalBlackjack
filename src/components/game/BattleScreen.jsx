import { PlusCircle, RefreshCw, ShieldAlert, User, Zap } from 'lucide-react';
import { Card } from './Card';
import { FlushBadge } from './FlushBadge';

export function BattleScreen({
  gameState,
  turn,
  rollingJoker,
  nDeckLength,
  nDiscardLength,
  visibleNData,
  npcHand,
  npcStand,
  npcActionText,
  battleMessage,
  pDeckLength,
  pDiscardLength,
  isSelectingStuff,
  isSelectingRedraw,
  hand,
  onCardClick,
  pData,
  playerStand,
  onHit,
  onStand,
  onStuffSkillClick,
  onRedrawSkillClick,
  skillCharges,
  redrawCharges,
}) {
  return (
    <div className="flex-1 flex flex-col justify-between pb-4 relative">
      <div className={`relative flex flex-col items-center transition-all duration-300 ${turn === 'NPC' && gameState === 'BATTLE' && !rollingJoker ? 'ring-2 ring-red-500/50 bg-red-900/10 rounded-3xl pb-2' : ''}`}>
        <div className="absolute -top-6 w-full px-6 flex justify-between text-[10px] text-slate-500 font-bold z-10 pointer-events-none">
          <span>恶魔牌库:{nDeckLength}</span><span>弃牌:{nDiscardLength}</span>
        </div>
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold border flex items-center gap-2 shadow-lg z-20 ${turn === 'NPC' ? 'bg-red-900 border-red-500 text-red-200 animate-pulse' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
          <User size={14} /> 深渊庄家 {visibleNData.score > 0 && !npcHand.some((card) => card.hidden) ? `(${visibleNData.score})` : '(?)'}
          {visibleNData.isFlush && !npcHand.some((card) => card.hidden) && <FlushBadge compact={true} align="center" />}
        </div>
        <div className="flex justify-center gap-[-40px] flex-wrap w-full bg-slate-900/40 p-8 pt-10 rounded-3xl border-t border-slate-800 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)] min-h-[180px]">
          {npcHand.map((card, idx) => (
            <div key={card.id + idx} className="relative transition-all duration-500 ease-out" style={{ marginLeft: idx === 0 ? 0 : '-3.5rem', zIndex: idx }}>
              <Card card={card} />
            </div>
          ))}
        </div>
        {npcStand && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-1 rounded">庄家已停牌</div>}
      </div>

      <div className="my-2 relative h-16 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

        {npcActionText && gameState === 'BATTLE' && !rollingJoker && (
          <div className="relative z-20 text-sm font-bold bg-slate-900/90 text-red-400 border border-red-900/50 px-6 py-2 rounded-full shadow-2xl animate-pulse">
            {npcActionText}
          </div>
        )}

        {battleMessage.text && (
          <div className={`relative z-30 font-black bg-slate-900/95 px-8 py-4 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md text-center whitespace-nowrap animate-in zoom-in-90 duration-300 ${battleMessage.type}`}>
            {battleMessage.text}
          </div>
        )}
      </div>

      <div className={`relative flex flex-col items-center transition-all duration-300 ${turn === 'PLAYER' && gameState === 'BATTLE' && !rollingJoker ? 'ring-2 ring-indigo-500/50 bg-indigo-900/10 rounded-3xl pb-4 pt-2' : ''}`}>
        {turn === 'PLAYER' && gameState === 'BATTLE' && !rollingJoker && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-indigo-600 border border-indigo-400 text-white animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)] z-20">
            你的回合
          </div>
        )}
        <div className="absolute -top-6 w-full px-6 flex justify-between text-[10px] text-slate-500 font-bold z-10 pointer-events-none">
          <span>玩家牌库:{pDeckLength}</span><span>弃牌:{pDiscardLength}</span>
        </div>
        <div className={`flex justify-center gap-[-40px] flex-wrap w-full z-10 min-h-[160px] mt-4 p-4 rounded-xl ${(isSelectingStuff || isSelectingRedraw) ? 'bg-slate-800/50 ring-2 ring-slate-500/50' : ''}`}>
          {hand.map((card, idx) => {
            const isSelectable = (isSelectingStuff || isSelectingRedraw) && !card.isSliced;
            const ringColor = isSelectingStuff ? 'ring-red-500' : 'ring-blue-500';

            return (
              <div key={card.id + idx} className={`relative transition-all duration-300 transform ${isSelectable ? 'hover:-translate-y-4 hover:z-50 cursor-pointer' : ''}`} style={{ marginLeft: idx === 0 ? 0 : '-3.5rem', zIndex: idx }}>
                <Card card={card} className={`shadow-[0_10px_20px_rgba(0,0,0,0.3)] ${isSelectable ? `ring-2 ${ringColor}` : ''}`} onClick={() => isSelectable && onCardClick(card)} />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="bg-indigo-900/40 border border-indigo-500/30 px-6 py-2 rounded-full text-lg font-black text-indigo-300 flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
            点数: <span className="text-2xl text-white">{pData.score}</span>
            {pData.isFlush && <FlushBadge align="left" />}
          </div>
          {playerStand && <div className="text-xs font-bold text-indigo-300 bg-indigo-900 px-3 py-2 rounded-full border border-indigo-500/50">已停牌</div>}
        </div>
      </div>

      <div className={`mt-6 grid grid-cols-2 gap-3 transition-opacity duration-300 ${turn === 'NPC' || playerStand || gameState !== 'BATTLE' || rollingJoker ? 'opacity-40 pointer-events-none' : ''}`}>
        <button onClick={onHit} disabled={isSelectingStuff || isSelectingRedraw} className="bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50">
          <PlusCircle size={20} className="text-green-400" /><span>抽牌 (Hit)</span>
        </button>

        <button onClick={onStand} disabled={isSelectingStuff || isSelectingRedraw} className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50">
          <ShieldAlert size={20} className="text-white" /><span>停牌 (Stand)</span>
        </button>

        <button disabled={skillCharges < 5 || hand.filter((card) => !card.isSliced).length === 0} onClick={onStuffSkillClick} className={`relative bg-slate-800 hover:bg-slate-700 disabled:opacity-50 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 ${isSelectingStuff ? 'border-red-900 bg-red-900/50' : 'border-slate-900'} active:border-b-0 active:translate-y-1 transition-all overflow-hidden`}>
          <Zap size={20} className={skillCharges >= 5 ? 'text-red-400' : 'text-slate-600'} />
          <span className={skillCharges >= 5 ? 'text-red-400' : 'text-slate-500'}>{isSelectingStuff ? '取消塞牌' : '定向塞牌'}</span>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900"><div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(skillCharges / 5) * 100}%` }}></div></div>
        </button>

        <button disabled={redrawCharges < 5 || hand.filter((card) => !card.isSliced).length === 0} onClick={onRedrawSkillClick} className={`relative bg-slate-800 hover:bg-slate-700 disabled:opacity-50 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 ${isSelectingRedraw ? 'border-blue-900 bg-blue-900/50' : 'border-slate-900'} active:border-b-0 active:translate-y-1 transition-all overflow-hidden`}>
          <RefreshCw size={20} className={redrawCharges >= 5 ? 'text-blue-400' : 'text-slate-600'} />
          <span className={redrawCharges >= 5 ? 'text-blue-400' : 'text-slate-500'}>{isSelectingRedraw ? '取消重抽' : '卡牌重抽'}</span>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(redrawCharges / 5) * 100}%` }}></div></div>
        </button>
      </div>
    </div>
  );
}