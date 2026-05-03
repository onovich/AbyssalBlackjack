import { ArrowRight, Sparkles } from 'lucide-react';
import { canEnchantCard } from '../../../game/domain/cards';
import { StatBar } from './StatBar';
import { CardView } from './CardView';

export function EnchantScreen({ state, onSelectEnchant, onApplyEnchant, onSkip }) {
  return (
    <section className="screen screen--shop">
      <StatBar hp={state.hp} coins={state.coins} stage={state.stage} />

      <div className="section-heading">
        <Sparkles size={18} />
        <span>深渊附魔</span>
      </div>

      <div className="shop-body">
        <div className="shop-section">
          <h2 className="shop-section__title">选择一种回响</h2>
          <p className="shop-section__subtitle">原版关键流程之一：为一张卡牌追加附属数字。</p>
          <div className="enchant-options">
            {state.enchantOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={state.selectedEnchantId === option.id ? 'enchant-chip enchant-chip--active' : 'enchant-chip'}
                onClick={() => onSelectEnchant(option.id)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="shop-section">
          <div className="shop-section__header-row">
            <h2 className="shop-section__title">把附魔落到一张牌上</h2>
            {!state.selectedEnchantId ? <span className="warning-tag">先选一个附魔</span> : null}
          </div>
          <div className="deck-grid">
            {state.deck.map((card) => (
              <CardView
                key={card.id}
                card={card}
                compact
                removable={Boolean(state.selectedEnchantId) && canEnchantCard(card)}
                onClick={() => onApplyEnchant(card.id, 'deck')}
              />
            ))}
            {state.discard.map((card) => (
              <CardView
                key={card.id}
                card={card}
                compact
                faded
                removable={Boolean(state.selectedEnchantId) && canEnchantCard(card)}
                onClick={() => onApplyEnchant(card.id, 'discard')}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="footer-action footer-action--stacked">
        <button type="button" className="ghost-button" onClick={onSkip}>
          跳过附魔
        </button>
        <button type="button" className="next-stage-button" onClick={onSkip}>
          <span>进入商店</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}