import { Dices, Play, RefreshCw, Sparkles, Sword } from 'lucide-react';

export function StartScreen({ onStart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700">
      <div className="text-center relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-30 blur-2xl rounded-full"></div>
        <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-300 drop-shadow-lg relative z-10">深渊对弈</h1>
        <p className="text-sm text-indigo-400 mt-2 font-bold tracking-widest uppercase">战略卡牌构筑</p>
      </div>
      <div className="text-slate-300 text-sm space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <p className="flex items-start gap-2"><Sword size={16} className="text-indigo-400 mt-0.5 shrink-0" /> 目标：每层都要让你的最终点数更接近 21，且不能爆牌；失败会损失 1 点生命。</p>
        <p className="flex items-start gap-2"><Sparkles size={16} className="text-blue-400 mt-0.5 shrink-0" /> 回合：你和庄家轮流行动，可以抽牌或停牌；双方都停下后结算胜负。</p>
        <p className="flex items-start gap-2"><RefreshCw size={16} className="text-blue-400 mt-0.5 shrink-0" /> 成长：胜利后可附魔卡牌，其他结果会进入商店；抽牌还能为塞牌与重抽技能充能。</p>
        <p className="flex items-start gap-2"><Dices size={16} className="text-purple-400 mt-0.5 shrink-0" /> 小丑：小丑牌可以反复掷骰加点，但每次都会更危险，贪多很容易直接炸掉。</p>
      </div>
      <button onClick={onStart} className="group relative px-10 py-4 bg-indigo-600 rounded-full font-black text-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.5)] overflow-hidden">
        <span className="relative z-10 flex items-center gap-2"><Play size={24} /> 跃入深渊</span>
      </button>
    </div>
  );
}