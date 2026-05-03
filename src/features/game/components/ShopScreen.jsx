import { ArrowRight, Coins, Heart, ShoppingCart, Trash2, WandSparkles } from 'lucide-react';
import { HEAL_COST, REMOVE_CARD_COST, SHOP_CARD_COST } from '../../../game/config';
import { StatBar } from './StatBar';
import { CardView } from './CardView';

export function ShopScreen({ state, onBuyCard, onHeal, onToggleRemoveMode, onRemoveCard, onNextStage }) {
  return (
    <section className="screen screen--shop">
      <StatBar hp={state.hp} coins={state.coins} stage={state.stage} />

      <div className="section-heading">
        <ShoppingCart size={18} />
        <span>局间商店</span>
      </div>

      {state.battleMessage.text ? (
        <div className="inline-notice inline-notice--success">
          <WandSparkles size={16} />
          <span>{state.battleMessage.text}</span>
        </div>
      ) : null}

      <div className="shop-body">
        <div className="shop-section">
          <h2 className="shop-section__title">招募卡牌</h2>
          <p className="shop-section__subtitle">
            每张 {SHOP_CARD_COST}
            <Coins size={12} />
          </p>
          <div className="shop-offers">
            {state.shopOffers.length > 0 ? (
              state.shopOffers.map((card, index) => (
                <div key={card.id} className="offer-slot">
                  <CardView card={card} onClick={() => onBuyCard(index)} />
                  <button
                    type="button"
                    className="price-chip"
                    disabled={state.coins < SHOP_CARD_COST}
                    onClick={() => onBuyCard(index)}
                  >
                    <span>{SHOP_CARD_COST}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">已被抢购一空</div>
            )}
          </div>
        </div>

        <div className="shop-section">
          <h2 className="shop-section__title">特殊服务</h2>
          <div className="service-grid">
            <button
              type="button"
              className="service-card"
              onClick={onHeal}
              disabled={state.coins < HEAL_COST || state.hp >= 3}
            >
              <Heart size={22} />
              <span>恢复 1 HP</span>
              <small>{HEAL_COST} 金币</small>
            </button>
            <button
              type="button"
              className={state.isRemoving ? 'service-card service-card--danger' : 'service-card'}
              onClick={onToggleRemoveMode}
              disabled={state.coins < REMOVE_CARD_COST && !state.isRemoving}
            >
              <Trash2 size={22} />
              <span>{state.isRemoving ? '选择下方卡牌' : '遗忘卡牌'}</span>
              <small>{REMOVE_CARD_COST} 金币</small>
            </button>
          </div>
        </div>

        <div className="shop-section">
          <div className="shop-section__header-row">
            <h2 className="shop-section__title">你的牌库 ({state.deck.length + state.discard.length} 张)</h2>
            {state.isRemoving ? <span className="warning-tag">点击卡牌移除</span> : null}
          </div>
          <div className="deck-grid">
            {state.deck.map((card) => (
              <CardView
                key={card.id}
                card={card}
                compact
                removable={state.isRemoving}
                onClick={() => onRemoveCard(card.id, 'deck')}
              />
            ))}
            {state.discard.map((card) => (
              <CardView
                key={card.id}
                card={card}
                compact
                faded
                removable={state.isRemoving}
                onClick={() => onRemoveCard(card.id, 'discard')}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="footer-action">
        <button type="button" className="next-stage-button" onClick={onNextStage} disabled={state.isRemoving}>
          <span>前往第 {state.stage + 2} 阶段</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}