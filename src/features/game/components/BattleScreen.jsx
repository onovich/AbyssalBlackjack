import { Dices, PackagePlus, PlusCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { calculateScoreData } from '../../../game/domain/cards';
import { StatBar } from './StatBar';
import { CardView } from './CardView';

const messageToneClassMap = {
  success: 'resolve-banner--success',
  danger: 'resolve-banner--danger',
  neutral: '',
};

export function BattleScreen({ state, onHit, onStand, onToggleRedraw, onExecuteRedraw, onToggleStuff, onExecuteStuff }) {
  const playerScoreData = calculateScoreData(state.hand, false);
  const npcVisibleScoreData = calculateScoreData(state.npcHand, false);

  return (
    <section className="screen screen--battle">
      <StatBar hp={state.hp} coins={state.coins} stage={state.stage} />

      <div className="panel duel-panel">
        <div className="duel-panel__row">
          <div className="duel-panel__label">
            <ShieldAlert size={14} />
            <span>虚拟庄家</span>
            <span className="turn-badge">{state.turn === 'NPC' ? '行动中' : '待机'}</span>
          </div>
          <div className="duel-panel__score">可见点数 {npcVisibleScoreData.score}</div>
        </div>
        <div className="npc-hand-row">
          {state.npcHand.map((card, index) => (
            <div key={card.id} className="hand-fan__slot" style={{ marginLeft: index === 0 ? 0 : '-1.2rem', zIndex: index + 1 }}>
              <CardView card={card} />
            </div>
          ))}
        </div>
      </div>

      <div className="deck-stats">
        <span>你的抽牌堆: {state.pDeck.length}</span>
        <span>你的弃牌堆: {state.pDiscard.length}</span>
        <span>庄家牌堆: {state.nDeck.length}</span>
      </div>

      <div className="hand-area">
        <div className="hand-area__header">
          你的手牌 ({playerScoreData.score})
          {playerScoreData.isFlush ? <span className="hand-badge">同花修正</span> : null}
          {state.rollingJoker ? <span className="hand-badge hand-badge--warning">小丑结算中</span> : null}
          {state.isSelectingRedraw ? <span className="hand-badge hand-badge--warning">选择一张牌重抽</span> : null}
          {state.isSelectingStuff ? <span className="hand-badge hand-badge--warning">选择一张牌进行塞牌</span> : null}
        </div>
        <div className="hand-fan">
          {state.hand.map((card, index) => (
            <div
              key={card.id}
              className="hand-fan__slot"
              style={{ marginLeft: index === 0 ? 0 : '-1.4rem', zIndex: index + 1 }}
            >
              <CardView
                card={card}
                onClick={state.isSelectingRedraw ? () => onExecuteRedraw(card.id) : state.isSelectingStuff ? () => onExecuteStuff(card.id) : undefined}
                removable={state.isSelectingRedraw || state.isSelectingStuff}
              />
            </div>
          ))}
        </div>

        {state.gameState === 'RESOLVE' && (
          <div className={['resolve-banner', messageToneClassMap[state.battleMessage.tone]].join(' ')}>
            {state.battleMessage.text}
          </div>
        )}
      </div>

      <div className="skill-strip">
        <div className="skill-stack">
          <button type="button" className={state.isSelectingRedraw ? 'skill-button skill-button--active' : 'skill-button'} onClick={onToggleRedraw} disabled={state.turn !== 'PLAYER' || Boolean(state.rollingJoker) || state.redrawCharges <= 0}>
            <Dices size={18} />
            <span>重抽</span>
            <small>{state.redrawCharges} / 5</small>
          </button>
          <button type="button" className={state.isSelectingStuff ? 'skill-button skill-button--active' : 'skill-button'} onClick={onToggleStuff} disabled={state.turn !== 'PLAYER' || Boolean(state.rollingJoker) || state.skillCharges <= 0}>
            <PackagePlus size={18} />
            <span>塞牌</span>
            <small>{state.skillCharges} / 5</small>
          </button>
        </div>
        <div className="skill-note">
          <Sparkles size={16} />
          <span>重抽会替换选中手牌，塞牌会把新牌插到选中牌后。剪刀会切断前一张牌，小丑会进入独立事件。</span>
        </div>
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