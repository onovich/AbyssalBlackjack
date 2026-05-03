import { createElement, useCallback } from 'react';
import { Scissors, Sparkles } from 'lucide-react';
import { generateNpcScalingCard, generateShopCards } from '../domain/cards';
import { getPostResolveState, resolveBattleState } from '../domain/engine';

const createEnchantOptions = (fusionValue) => [
  {
    type: 'fusion',
    value: fusionValue,
    title: `融合: 附加 [${fusionValue}] 点`,
    desc: '赋予卡牌双重点数能力',
    icon: createElement(Sparkles, { className: 'text-blue-400' }),
  },
  {
    type: 'scissor',
    title: '附魔: 剪刀手',
    desc: '打出或塞给敌方时，斩碎前一张牌',
    icon: createElement(Scissors, { className: 'text-red-400' }),
  },
];

export function useProgressionFlow({
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
}) {
  const executeResolve = useCallback((finalPlayerHand, finalNpcHand, playerBusted, instantWin = false) => {
    setGameState('RESOLVE');
    setNpcActionText('');

    const resolveState = resolveBattleState({
      finalPlayerHand,
      finalNpcHand,
      playerBusted,
      instantWin,
    });

    setNpcHand(resolveState.revealedNpc);

    if (resolveState.battleMessage) {
      setBattleMessage(resolveState.battleMessage);
    }

    setTimeout(() => {
      const postResolveState = getPostResolveState({
        hp,
        stage,
        result: resolveState.result,
        finalPlayerHand,
        revealedNpc: resolveState.revealedNpc,
      });

      setHp(postResolveState.finalHp);

      if (postResolveState.nextGameState === 'OVER' || postResolveState.nextGameState === 'WIN') {
        setGameState(postResolveState.nextGameState);
      } else {
        setPDiscard((currentDiscard) => [...currentDiscard, ...postResolveState.playerDiscard]);
        setNDiscard((currentDiscard) => [...currentDiscard, ...postResolveState.npcDiscard]);

        setHand([]);
        setNpcHand([]);

        if (postResolveState.nextGameState === 'ENCHANT') {
          setCoins((currentCoins) => currentCoins + postResolveState.coinDelta);
          const fusionValue = Math.floor(Math.random() * 8) + 2;
          setEnchantOptions(createEnchantOptions(fusionValue));
          setGameState('ENCHANT');
        } else {
          setCoins((currentCoins) => currentCoins + postResolveState.coinDelta);
          setShopOffers(generateShopCards());
          setGameState('SHOP');
        }
      }
    }, 3000);
  }, [hp, setBattleMessage, setCoins, setEnchantOptions, setGameState, setHand, setHp, setNDiscard, setNpcActionText, setNpcHand, setPDiscard, setShopOffers, stage]);

  const triggerInstantWin = useCallback((playerHand, currentNpcHand) => {
    setGameState('RESOLVE');
    setBattleMessage({ text: '完美 21 点！直接胜利！', type: 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,1)] text-4xl font-black scale-110 animate-pulse' });
    setTimeout(() => {
      executeResolve(playerHand, currentNpcHand, false, true);
    }, 2000);
  }, [executeResolve, setBattleMessage, setGameState]);

  const applyEnchantToCard = useCallback((targetCard) => {
    let updatedCard = { ...targetCard };
    updatedCard.values = [...targetCard.baseValues];
    updatedCard.isScissor = false;
    updatedCard.rank = targetCard.baseRank;

    if (selectedEnchant.type === 'fusion') {
      const newValues = Array.from(new Set([...updatedCard.values, selectedEnchant.value])).sort((a, b) => a - b);
      updatedCard.values = newValues;
      updatedCard.rank = newValues.join('/');
    } else if (selectedEnchant.type === 'scissor') {
      updatedCard.isScissor = true;
    }

    if (pDeck.find((card) => card.id === targetCard.id)) {
      setPDeck(pDeck.map((card) => (card.id === targetCard.id ? updatedCard : card)));
    } else {
      setPDiscard(pDiscard.map((card) => (card.id === targetCard.id ? updatedCard : card)));
    }

    setSelectedEnchant(null);
    setShopOffers(generateShopCards());
    setGameState('SHOP');
  }, [pDeck, pDiscard, selectedEnchant, setGameState, setPDeck, setPDiscard, setSelectedEnchant, setShopOffers]);

  const skipEnchant = useCallback(() => {
    setShopOffers(generateShopCards());
    setGameState('SHOP');
  }, [setGameState, setShopOffers]);

  const buyCard = useCallback((card, index) => {
    if (coins >= 4) {
      setCoins((currentCoins) => currentCoins - 4);
      setPDiscard((currentDiscard) => [...currentDiscard, card]);
      setShopOffers((currentOffers) => currentOffers.filter((_, offerIndex) => offerIndex !== index));
    }
  }, [coins, setCoins, setPDiscard, setShopOffers]);

  const heal = useCallback(() => {
    if (coins >= 5 && hp < 5) {
      setCoins((currentCoins) => currentCoins - 5);
      setHp((currentHp) => currentHp + 1);
    }
  }, [coins, hp, setCoins, setHp]);

  const toggleRemoving = useCallback(() => {
    if (coins >= 3) {
      setIsRemoving((currentValue) => !currentValue);
    }
  }, [coins, setIsRemoving]);

  const handleRemoveCard = useCallback((cardId, location) => {
    if (!isRemoving || coins < 3) return;

    setCoins((currentCoins) => currentCoins - 3);
    if (location === 'deck') setPDeck((currentDeck) => currentDeck.filter((card) => card.id !== cardId));
    else setPDiscard((currentDiscard) => currentDiscard.filter((card) => card.id !== cardId));
    setIsRemoving(false);
  }, [coins, isRemoving, setCoins, setIsRemoving, setPDeck, setPDiscard]);

  const nextStage = useCallback(() => {
    setStage((currentStage) => currentStage + 1);
    setNDiscard((currentDiscard) => [...currentDiscard, generateNpcScalingCard()]);
    startStage(pDeck, pDiscard, nDeck, nDiscard);
  }, [nDeck, nDiscard, pDeck, pDiscard, setNDiscard, setStage, startStage]);

  return {
    executeResolve,
    triggerInstantWin,
    applyEnchantToCard,
    skipEnchant,
    buyCard,
    heal,
    toggleRemoving,
    handleRemoveCard,
    nextStage,
  };
}