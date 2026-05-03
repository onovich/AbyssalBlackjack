import { Dices, WandSparkles } from 'lucide-react';

export function JokerOverlay({ state, onRoll, onAccept }) {
  if (!state.rollingJoker) {
    return null;
  }

  return (
    <div className="joker-overlay">
      <div className="joker-panel">
        <div className="joker-panel__eyebrow">
          <WandSparkles size={16} />
          <span>小丑牌事件</span>
        </div>
        <h2>先决定这张牌的点数</h2>
        <p>原版流程会在抽到小丑牌时中断常规操作，先进行一次独立结算。</p>
        <div className="joker-roll-value">{state.jokerRollValue ?? '?'}</div>
        <div className="joker-panel__meta">已掷 {state.jokerDiceCount} 次</div>
        <div className="joker-panel__actions">
          <button type="button" className="cta-button" onClick={onRoll}>
            <Dices size={18} />
            <span>{state.jokerRollValue ? '重掷' : '掷骰'}</span>
          </button>
          <button type="button" className="ghost-button" onClick={onAccept} disabled={!state.jokerRollValue}>
            接受点数
          </button>
        </div>
      </div>
    </div>
  );
}