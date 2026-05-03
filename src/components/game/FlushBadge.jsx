import { CircleHelp, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

export function FlushBadge({ compact = false, align = 'center' }) {
  const [open, setOpen] = useState(false);

  const badgeClassName = compact
    ? 'px-2 py-1 text-[11px] text-blue-200 bg-blue-950/80 border border-blue-500/40'
    : 'px-2 py-1 text-xs text-blue-300 bg-blue-900/50';

  const panelClassName = align === 'left'
    ? 'left-0'
    : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex pointer-events-auto">
      <span className={`inline-flex items-center gap-1 rounded-md ${badgeClassName}`}>
        <Sparkles size={12} /> 同花
        <button
          type="button"
          aria-label="查看同花效果说明"
          aria-expanded={open}
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-blue-300/50 text-blue-100 transition-colors hover:bg-blue-200/15"
        >
          <CircleHelp size={11} />
        </button>
      </span>

      {open && (
        <div className={`absolute top-full z-40 mt-2 w-64 rounded-xl border border-blue-500/30 bg-slate-950/95 p-3 text-left text-xs font-medium text-slate-200 shadow-2xl ${panelClassName}`}>
          <div className="mb-2 flex items-start justify-between gap-2 text-sm font-bold text-blue-300">
            <span>同花效果</span>
            <button
              type="button"
              aria-label="关闭同花效果说明"
              onClick={() => setOpen(false)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
          <p>当前参与计分的牌至少有 2 张且花色完全相同时，系统会把最终点数额外当作 +1 或 -1 再各算一次，并自动采用最优且不爆牌的结果。</p>
        </div>
      )}
    </span>
  );
}