import { PlusCircle, ShieldAlert } from 'lucide-react';
import { TARGETS } from '../../../game/config';
import { calculateScoreData } from '../../../game/domain/cards';
import { StatBar } from './StatBar';
import { CardView } from './CardView';

const messageToneClassMap = {
  success: 'resolve-banner--success',
  danger: 'resolve-banner--danger',
  neutral: '',
};

export function BattleScreen({ state, onHit, onStand }) {
  const scoreData = calculateScoreData(state.hand);
  const score = scoreData.score;
  const currentTarget = TARGETS[state.stage];

  return (
    <section className="screen screen--battle">
      <StatBar hp={state.hp} coins={state.coins} stage={state.stage} />

      <div className="panel target-panel">
        <div className="target-panel__label">
          <ShieldAlert size={14} />
          <span>虚拟庄家</span>
        </div>
        <div className="target-panel__content">
          <div className="target-panel__caption">目标点数</div>
          <div className="target-panel__value">{currentTarget}</div>
        </div>
      </div>

      <div className="deck-stats">
        <span>抽牌堆: {state.deck.length}</span>
        <span>弃牌堆: {state.discard.length}</span>
      </div>

      <div className="hand-area">
        <div className="hand-area__header">
          你的手牌 ({score})
          {scoreData.isFlush ? <span className="hand-badge">同花修正</span> : null}
          {state.rollingJoker ? <span className="hand-badge hand-badge--warning">小丑结算中</span> : null}
        </div>
        <div className="hand-fan">
          {state.hand.map((card, index) => (
            <div
              key={card.id}
              className="hand-fan__slot"
              style={{ marginLeft: index === 0 ? 0 : '-1.4rem', zIndex: index + 1 }}
            >
              <CardView card={card} />
            </div>
          ))}
        </div>

        {state.gameState === 'RESOLVE' && (
          <div className={['resolve-banner', messageToneClassMap[state.battleMessage.tone]].join(' ')}>
            {state.battleMessage.text}
          </div>
        )}
      </div>

      <div className="action-grid">
        <button
          type="button"
          className="action-button action-button--secondary"
          onClick={onHit}
          disabled={state.gameState !== 'BATTLE' || Boolean(state.rollingJoker)}
        >
          <PlusCircle size={22} />
          <span>拿牌</span>
          <small>Hit</small>
        </button>
        <button
          type="button"
          className="action-button action-button--primary"
          onClick={onStand}
          disabled={state.gameState !== 'BATTLE' || Boolean(state.rollingJoker)}
        >
          <ShieldAlert size={22} />
          <span>停牌</span>
          <small>Stand</small>
        </button>
      </div>
    </section>
  );
}