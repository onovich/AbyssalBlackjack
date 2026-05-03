import React, { useState, useCallback } from 'react';
import { MAX_HP, MAX_STAGES } from './game/constants';
import { calculateScoreData, generateInitialDeck } from './game/domain/cards';
import { drawSingleCard, prepareStageStart, resolveHitState, resolveRedrawState, resolveStuffState } from './game/domain/engine';
import { BattleScreen } from './components/game/BattleScreen';
import { EnchantScreen } from './components/game/EnchantScreen';
import { EndScreen } from './components/game/EndScreen';
import { HeaderBar } from './components/game/HeaderBar';
import { JokerOverlay } from './components/game/JokerOverlay';
import { SelectionOverlay } from './components/game/SelectionOverlay';
import { ShopScreen } from './components/game/ShopScreen';
import { StartScreen } from './components/game/StartScreen';
import { useBattleFlow } from './game/hooks/useBattleFlow';
import { useProgressionFlow } from './game/hooks/useProgressionFlow';

export default function AbyssalBlackjack() {
  const [gameState, setGameState] = useState('START'); 
  const [turn, setTurn] = useState('PLAYER'); 
  
  const [pDeck, setPDeck] = useState([]);
  const [pDiscard, setPDiscard] = useState([]);
  const [nDeck, setNDeck] = useState([]);
  const [nDiscard, setNDiscard] = useState([]);
  
  const [hand, setHand] = useState([]);
  const [npcHand, setNpcHand] = useState([]);
  
  const [playerStand, setPlayerStand] = useState(false);
  const [npcStand, setNpcStand] = useState(false);

  const [hp, setHp] = useState(MAX_HP);
  const [coins, setCoins] = useState(0);
  const [stage, setStage] = useState(1);
  
  // 技能充能状态
  const [skillCharges, setSkillCharges] = useState(0);
  const [redrawCharges, setRedrawCharges] = useState(0);
  
  // 技能选择状态
  const [isSelectingStuff, setIsSelectingStuff] = useState(false);
  const [isSelectingRedraw, setIsSelectingRedraw] = useState(false);

  // 小丑牌状态
  const [rollingJoker, setRollingJoker] = useState(null);
  const [jokerDiceCount, setJokerDiceCount] = useState(1); // 控制骰子数量增加

  const [battleMessage, setBattleMessage] = useState({ text: '', type: '' });
  const [npcActionText, setNpcActionText] = useState('');
  
  const [shopOffers, setShopOffers] = useState([]);
  const [enchantOptions, setEnchantOptions] = useState([]);
  const [selectedEnchant, setSelectedEnchant] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // --- 基础发牌与状态管理 ---

  const startStage = useCallback((tempPDeck = pDeck, tempPDiscard = pDiscard, tempNDeck = nDeck, tempNDiscard = nDiscard) => {
    const stageState = prepareStageStart({
      playerDeck: tempPDeck,
      playerDiscard: tempPDiscard,
      npcDeck: tempNDeck,
      npcDiscard: tempNDiscard,
    });

    setTimeout(() => setHand(curr => curr.filter(c => !c.isSliced)), 600);
    setTimeout(() => setNpcHand(curr => curr.filter(c => !c.isSliced)), 600);

    setPDeck(stageState.playerDeck); setPDiscard(stageState.playerDiscard);
    setNDeck(stageState.npcDeck); setNDiscard(stageState.npcDiscard);
    
    setHand(stageState.playerHand); setNpcHand(stageState.npcHand);
    setPlayerStand(false); setNpcStand(false);
    setTurn('PLAYER'); setGameState('BATTLE');
    setBattleMessage({ text: '', type: '' }); setNpcActionText('');
    setIsSelectingStuff(false); setIsSelectingRedraw(false); 
    setRollingJoker(null); setJokerDiceCount(1);

    if (stageState.initialJoker) {
        setRollingJoker({ ...stageState.initialJoker, source: 'START' });
    } else if (stageState.playerHits21) {
        triggerInstantWin(stageState.playerHand, stageState.npcHand);
    }
  }, [pDeck, pDiscard, nDeck, nDiscard]);

  const startGame = () => {
    const initPDeck = generateInitialDeck('PLAYER');
    const initNDeck = generateInitialDeck('NPC');
    setHp(MAX_HP); setCoins(0); setStage(1); 
    setSkillCharges(0); setRedrawCharges(0);
    startStage(initPDeck, [], initNDeck, []);
  };

  const { executeResolve, triggerInstantWin, applyEnchantToCard, skipEnchant, buyCard, heal, toggleRemoving, handleRemoveCard, nextStage } = useProgressionFlow({
    hp,
    stage,
    coins,
    hand,
    pDeck,
    pDiscard,
    nDeck,
    nDiscard,
    selectedEnchant,
    isRemoving,
    setGameState,
    setNpcActionText,
    setNpcHand,
    setBattleMessage,
    setHp,
    setPDiscard,
    setNDiscard,
    setHand,
    setCoins,
    setEnchantOptions,
    setShopOffers,
    setSelectedEnchant,
    setPDeck,
    setIsRemoving,
    setStage,
    startStage,
  });

  // --- 玩家动作逻辑 ---

  const handleHit = () => {
    if (isSelectingStuff) setIsSelectingStuff(false);
    if (isSelectingRedraw) setIsSelectingRedraw(false);
    
    const { drawn, deck: newDeck, discard: newDiscard } = drawSingleCard(pDeck, pDiscard);
    setPDeck(newDeck); setPDiscard(newDiscard);
    if (!drawn) return;

     const hitState = resolveHitState({ hand, drawn });
     setHand(hitState.hand);
    
    // 增加技能充能
    setSkillCharges(prev => Math.min(5, prev + 1));
    setRedrawCharges(prev => Math.min(5, prev + 1));

    setTimeout(() => setHand(curr => curr.filter(c => !c.isSliced)), 600);

     if (hitState.drewJoker) {
       setRollingJoker({ ...drawn, source: 'HIT' });
       return; 
    }

     if (hitState.handData.isBust) executeResolve(hitState.hand, npcHand, true);
     else if (hitState.handData.score === 21) triggerInstantWin(hitState.hand, npcHand);
    else if (!npcStand) setTurn('NPC');
  };

  const handleStand = () => {
    if (isSelectingStuff) setIsSelectingStuff(false);
    if (isSelectingRedraw) setIsSelectingRedraw(false);
    setPlayerStand(true);
    if (npcStand) executeResolve(hand, npcHand, false);
    else setTurn('NPC');
  };

  // 塞牌技能
  const handleStuffSkillClick = () => {
    if (skillCharges < 5 || hand.filter(c=>!c.isSliced).length === 0) return;
    if (isSelectingRedraw) setIsSelectingRedraw(false);
    setIsSelectingStuff(!isSelectingStuff);
  };

  // 重抽技能
  const handleRedrawSkillClick = () => {
    if (redrawCharges < 5 || hand.filter(c=>!c.isSliced).length === 0) return;
    if (isSelectingStuff) setIsSelectingStuff(false);
    setIsSelectingRedraw(!isSelectingRedraw);
  };

  // 卡牌点击分发逻辑 (根据选中的技能)
  const handleCardClick = (card) => {
    if (isSelectingStuff) executeStuffCard(card);
    else if (isSelectingRedraw) executeRedrawCard(card);
  };

  const executeStuffCard = (card) => {
    setIsSelectingStuff(false);
    setSkillCharges(prev => prev - 5);

    const stuffState = resolveStuffState({ hand, npcHand, card });
    setHand(stuffState.playerHand);
    setNpcHand(stuffState.npcHand);

    setTimeout(() => setNpcHand(curr => curr.filter(c => !c.isSliced)), 600);

    if (stuffState.npcData.isBust) {
        setGameState('RESOLVE');
        setBattleMessage({ text: '塞牌斩杀！敌方被撑爆了！', type: 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,1)] text-3xl font-black scale-110' });
      setTimeout(() => { executeResolve(stuffState.playerHand, stuffState.npcHand, false); }, 2000);
    } else {
        setBattleMessage({ text: '已强行塞入敌方手中！', type: 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)] text-2xl font-black' });
        setTimeout(() => {
             setBattleMessage({ text: '', type: '' });
         if (stuffState.playerData.score === 21) triggerInstantWin(stuffState.playerHand, stuffState.npcHand);
             else if (!npcStand) setTurn('NPC');
        }, 1200);
    }
  };

  const executeRedrawCard = (card) => {
    setIsSelectingRedraw(false);
    setRedrawCharges(prev => prev - 5);

    // 抽出新牌
    const { drawn, deck: newDeck, discard: newDiscard } = drawSingleCard(pDeck, pDiscard);
    setPDeck(newDeck); setPDiscard(newDiscard);
    
    // 将被换掉的牌放入弃牌堆
    setPDiscard(prev => [...prev, card]);

    const redrawState = resolveRedrawState({ hand, cardId: card.id, drawn });
    if (!redrawState) return;

    setHand(redrawState.hand);
    setTimeout(() => setHand(curr => curr.filter(c => !c.isSliced)), 600);

    if (redrawState.drewJoker) {
        setRollingJoker({ ...drawn, source: 'HIT' }); 
        return;
    }

    if (redrawState.handData.isBust) executeResolve(redrawState.hand, npcHand, true);
    else if (redrawState.handData.score === 21) triggerInstantWin(redrawState.hand, npcHand);
    else if (!npcStand) setTurn('NPC');
  };

  const { handleRollJoker, handleStopJoker } = useBattleFlow({
    gameState,
    turn,
    rollingJoker,
    jokerDiceCount,
    hand,
    npcHand,
    npcStand,
    playerStand,
    nDeck,
    nDiscard,
    setHand,
    setRollingJoker,
    setJokerDiceCount,
    setBattleMessage,
    setTurn,
    setNpcActionText,
    setNDeck,
    setNDiscard,
    setNpcHand,
    setNpcStand,
    executeResolve,
    triggerInstantWin,
  });

  // --- 渲染辅助 ---
  const pData = calculateScoreData(hand, true);
  const visibleNData = calculateScoreData(npcHand, false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 font-sans select-none overflow-x-hidden relative">
      <JokerOverlay rollingJoker={rollingJoker} handScore={calculateScoreData(hand, true).score} jokerDiceCount={jokerDiceCount} onRoll={handleRollJoker} onStop={handleStopJoker} />
      <SelectionOverlay isSelectingStuff={isSelectingStuff} isSelectingRedraw={isSelectingRedraw} onCancel={() => { setIsSelectingStuff(false); setIsSelectingRedraw(false); }} />

      <div className="w-full max-w-md flex-1 flex flex-col relative z-10">
        <HeaderBar hp={hp} maxHp={MAX_HP} coins={coins} stage={stage} maxStages={MAX_STAGES} />

        {gameState === 'START' && <StartScreen onStart={startGame} />}

        {['BATTLE', 'RESOLVE'].includes(gameState) && (
          <BattleScreen
            gameState={gameState}
            turn={turn}
            rollingJoker={rollingJoker}
            nDeckLength={nDeck.length}
            nDiscardLength={nDiscard.length}
            visibleNData={visibleNData}
            npcHand={npcHand}
            npcStand={npcStand}
            npcActionText={npcActionText}
            battleMessage={battleMessage}
            pDeckLength={pDeck.length}
            pDiscardLength={pDiscard.length}
            isSelectingStuff={isSelectingStuff}
            isSelectingRedraw={isSelectingRedraw}
            hand={hand}
            onCardClick={handleCardClick}
            pData={pData}
            playerStand={playerStand}
            onHit={handleHit}
            onStand={handleStand}
            onStuffSkillClick={handleStuffSkillClick}
            onRedrawSkillClick={handleRedrawSkillClick}
            skillCharges={skillCharges}
            redrawCharges={redrawCharges}
          />
        )}

        {gameState === 'ENCHANT' && (
          <EnchantScreen
            selectedEnchant={selectedEnchant}
            enchantOptions={enchantOptions}
            onSelectEnchant={setSelectedEnchant}
            onSkip={skipEnchant}
            cards={[...pDeck, ...pDiscard]}
            onApplyEnchant={applyEnchantToCard}
            onBack={() => setSelectedEnchant(null)}
          />
        )}

        {gameState === 'SHOP' && (
          <ShopScreen
            shopOffers={shopOffers}
            coins={coins}
            hp={hp}
            maxHp={MAX_HP}
            totalCards={pDeck.length + pDiscard.length}
            pDeck={pDeck}
            pDiscard={pDiscard}
            isRemoving={isRemoving}
            onBuyCard={buyCard}
            onHeal={heal}
            onToggleRemoving={toggleRemoving}
            onRemoveCard={handleRemoveCard}
            onNextStage={nextStage}
            nextStageLabel={stage + 1}
          />
        )}

        {(gameState === 'OVER' || gameState === 'WIN') && (
          <EndScreen gameState={gameState} stage={stage} coins={coins} totalCards={pDeck.length + pDiscard.length + hand.length} onRestart={startGame} />
        )}

      </div>
    </div>
  );
}