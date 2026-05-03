export function SelectionOverlay({ isSelectingStuff, isSelectingRedraw, onCancel }) {
  if (!isSelectingStuff && !isSelectingRedraw) return null;

  return (
    <div className={`absolute top-24 z-40 text-white px-6 py-3 rounded-full font-bold flex gap-4 items-center shadow-lg animate-bounce cursor-pointer border ${isSelectingStuff ? 'bg-red-900/90 border-red-500 shadow-red-500/50' : 'bg-blue-900/90 border-blue-500 shadow-blue-500/50'}`} onClick={onCancel}>
      <span>{isSelectingStuff ? '点击手牌：将其塞入敌方阵营' : '点击手牌：消耗技能重抽该卡'}</span>
      <span className="bg-slate-900/50 px-2 rounded text-xs">取消</span>
    </div>
  );
}