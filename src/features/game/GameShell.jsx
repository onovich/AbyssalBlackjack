import { Sparkles } from 'lucide-react';
import { useAbyssalBlackjack } from '../../game/hooks/useAbyssalBlackjack';
import { BattleScreen } from './components/BattleScreen';
import { EnchantScreen } from './components/EnchantScreen';
import { EndScreen } from './components/EndScreen';
import { JokerOverlay } from './components/JokerOverlay';
import { ShopScreen } from './components/ShopScreen';
import { StartScreen } from './components/StartScreen';

export function GameShell() {
  const { state, actions } = useAbyssalBlackjack();

  let content = <StartScreen onStart={actions.startGame} />;

  if (state.gameState === 'BATTLE' || state.gameState === 'RESOLVE') {
    content = <BattleScreen state={state} onHit={actions.hit} onStand={actions.stand} />;
  } else if (state.gameState === 'ENCHANT') {
    content = (
      <EnchantScreen
        state={state}
        onSelectEnchant={actions.selectEnchant}
        onApplyEnchant={actions.applyEnchant}
        onSkip={actions.skipEnchant}
      />
    );
  } else if (state.gameState === 'SHOP') {
    content = (
      <ShopScreen
        state={state}
        onBuyCard={actions.buyCard}
        onHeal={actions.heal}
        onToggleRemoveMode={actions.toggleRemoveMode}
        onRemoveCard={actions.removeCard}
        onNextStage={actions.nextStage}
      />
    );
  } else if (state.gameState === 'OVER' || state.gameState === 'WIN') {
    content = <EndScreen state={state} onRestart={actions.startGame} />;
  }

  return (
    <main className="app-shell">
      <div className="app-shell__noise" />
      <div className="app-shell__frame">
        <header className="title-block">
          <div className="title-block__eyebrow">
            <Sparkles size={14} />
            <span>AbyssalBlackjack</span>
          </div>
          <h1>深渊 21 点</h1>
          <p>Roguelike Deckbuilder</p>
        </header>
        {content}
      </div>
      <JokerOverlay state={state} onRoll={actions.rollJoker} onAccept={actions.acceptJoker} />
    </main>
  );
}