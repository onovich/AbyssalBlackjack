import { Coins, RefreshCw } from 'lucide-react';

export function EndScreen({ state, onRestart }) {
  const isVictory = state.gameState === 'WIN';

  return (
    <section className="screen screen--centered end-screen">
      <div className="end-screen__headline">
        {isVictory ? (
          <>
            <h2 className="end-screen__title end-screen__title--victory">通关</h2>
            <p>你已经穿透这条下潜路线里最深的一层。</p>
          </>
        ) : (
          <>
            <h2 className="end-screen__title end-screen__title--defeat">Game Over</h2>
            <p>生命耗尽，止步于第 {state.stage + 1} 阶段。</p>
          </>
        )}
      </div>

      <div className="panel result-card">
        <div className="result-card__label">最终战绩</div>
        <div className="result-row">
          <span>剩余金币</span>
          <strong>
            {state.coins} <Coins size={15} />
          </strong>
        </div>
        <div className="result-row">
          <span>牌库厚度</span>
          <strong>{state.pDeck.length + state.pDiscard.length + state.hand.length} 张</strong>
        </div>
      </div>

      <button type="button" className="retry-button" onClick={onRestart}>
        <RefreshCw size={18} />
        <span>重新挑战</span>
      </button>
    </section>
  );
}