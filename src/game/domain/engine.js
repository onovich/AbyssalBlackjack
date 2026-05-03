import { MAX_STAGES } from '../constants';
import { calculateScoreData, shuffle } from './cards';

export const drawSingleCard = (currentDeck, currentDiscard) => {
  let deck = [...currentDeck];
  let discard = [...currentDiscard];

  if (deck.length === 0) {
    deck = shuffle(discard);
    discard = [];
  }

  if (deck.length === 0) {
    return { drawn: null, deck, discard };
  }

  return { drawn: deck.pop(), deck, discard };
};

const rollNpcJoker = (card) => {
  if (card && card.isJoker) {
    const roll = Math.floor(Math.random() * 6) + 1;
    card.values = [roll];
    card.rank = `🃏${roll}`;
  }
};

export const prepareStageStart = ({ playerDeck, playerDiscard, npcDeck, npcDiscard }) => {
  let nextPlayerDeck = [...playerDeck];
  let nextPlayerDiscard = [...playerDiscard];
  let nextNpcDeck = [...npcDeck];
  let nextNpcDiscard = [...npcDiscard];

  const drawForPlayer = () => {
    const result = drawSingleCard(nextPlayerDeck, nextPlayerDiscard);
    nextPlayerDeck = result.deck;
    nextPlayerDiscard = result.discard;
    return result.drawn;
  };

  const drawForNpc = () => {
    const result = drawSingleCard(nextNpcDeck, nextNpcDiscard);
    nextNpcDeck = result.deck;
    nextNpcDiscard = result.discard;
    return result.drawn;
  };

  const firstPlayerCard = drawForPlayer();
  const secondPlayerCard = drawForPlayer();
  const firstNpcCard = drawForNpc();
  const secondNpcCard = drawForNpc();

  const playerHand = [];
  if (firstPlayerCard) playerHand.push(firstPlayerCard);
  if (secondPlayerCard) {
    if (secondPlayerCard.isScissor && playerHand.length > 0) {
      playerHand[playerHand.length - 1].isSliced = true;
    }
    playerHand.push(secondPlayerCard);
  }

  rollNpcJoker(firstNpcCard);
  rollNpcJoker(secondNpcCard);

  const npcHand = [];
  if (firstNpcCard) npcHand.push(firstNpcCard);
  if (secondNpcCard) {
    if (secondNpcCard.isScissor && npcHand.length > 0) {
      npcHand[npcHand.length - 1].isSliced = true;
    }
    npcHand.push({ ...secondNpcCard, hidden: true });
  }

  const initialJoker = playerHand.find((card) => card.isJoker && card.values[0] === 0 && !card.isSliced) || null;
  const initialPlayerData = calculateScoreData(playerHand, true);

  return {
    playerDeck: nextPlayerDeck,
    playerDiscard: nextPlayerDiscard,
    npcDeck: nextNpcDeck,
    npcDiscard: nextNpcDiscard,
    playerHand,
    npcHand,
    initialJoker,
    playerHits21: initialPlayerData.score === 21,
  };
};

export const resolveBattleState = ({ finalPlayerHand, finalNpcHand, playerBusted, instantWin = false }) => {
  const revealedNpc = finalNpcHand.map((card) => ({ ...card, hidden: false }));
  const playerData = calculateScoreData(finalPlayerHand, true);
  const npcData = calculateScoreData(revealedNpc, true);

  let result = '';
  if (instantWin) result = 'WIN';
  else if (playerBusted || playerData.isBust) result = 'LOSS';
  else if (npcData.isBust) result = 'WIN';
  else if (playerData.score > npcData.score) result = 'WIN';
  else if (playerData.score < npcData.score) result = 'LOSS';
  else result = 'DRAW';

  let battleMessage = null;
  if (!instantWin) {
    if (result === 'WIN') {
      battleMessage = {
        text: `胜利！ ${playerData.score} 击溃了 ${npcData.score}`,
        type: 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]',
      };
    } else if (result === 'LOSS') {
      battleMessage = {
        text: playerBusted ? `爆牌了！ (${playerData.score})` : `败北！ ${playerData.score} 不敌 ${npcData.score}`,
        type: 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]',
      };
    } else {
      battleMessage = {
        text: `势均力敌的平局 (${playerData.score})`,
        type: 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]',
      };
    }
  }

  return {
    result,
    revealedNpc,
    playerData,
    npcData,
    battleMessage,
  };
};

const cleanResolvedCard = (card) => ({
  ...card,
  isSliced: false,
  values: card.isJoker ? [0] : card.values,
  rank: card.isJoker ? 'JOKER' : card.rank,
  hidden: false,
});

export const getPostResolveState = ({ hp, stage, result, finalPlayerHand, revealedNpc, maxStages = MAX_STAGES }) => {
  const finalHp = hp - (result === 'LOSS' ? 1 : 0);
  const allPlayedCards = [...finalPlayerHand, ...revealedNpc].map(cleanResolvedCard);
  const playerDiscard = allPlayedCards.filter((card) => card.owner === 'PLAYER');
  const npcDiscard = allPlayedCards.filter((card) => card.owner === 'NPC');

  let nextGameState = 'SHOP';
  if (finalHp <= 0) nextGameState = 'OVER';
  else if (stage >= maxStages && result === 'WIN') nextGameState = 'WIN';
  else if (result === 'WIN') nextGameState = 'ENCHANT';

  const coinDelta = result === 'WIN' ? 6 : result === 'DRAW' ? 2 : 1;

  return {
    finalHp,
    nextGameState,
    playerDiscard,
    npcDiscard,
    coinDelta,
  };
};

const appendCardWithScissor = (hand, card) => {
  const nextHand = [...hand];
  if (card.isScissor && nextHand.length > 0) {
    nextHand[nextHand.length - 1].isSliced = true;
  }
  nextHand.push(card);
  return nextHand;
};

export const resolveHitState = ({ hand, drawn }) => {
  const nextHand = appendCardWithScissor(hand, drawn);

  return {
    hand: nextHand,
    drewJoker: drawn.isJoker,
    handData: calculateScoreData(nextHand, true),
  };
};

export const resolveStuffState = ({ hand, npcHand, card }) => {
  const nextPlayerHand = hand.filter((entry) => entry.id !== card.id);
  const nextNpcHand = appendCardWithScissor(npcHand, { ...card, hidden: false });

  return {
    playerHand: nextPlayerHand,
    npcHand: nextNpcHand,
    playerData: calculateScoreData(nextPlayerHand, true),
    npcData: calculateScoreData(nextNpcHand, true),
  };
};

export const resolveRedrawState = ({ hand, cardId, drawn }) => {
  const index = hand.findIndex((card) => card.id === cardId);
  if (index === -1) {
    return null;
  }

  if (!drawn) {
    const nextHand = [...hand];
    nextHand.splice(index, 1);
    return {
      hand: nextHand,
      drewJoker: false,
      handData: calculateScoreData(nextHand, true),
    };
  }

  const nextHand = [...hand];
  nextHand[index] = drawn;
  if (drawn.isScissor && index > 0) {
    nextHand[index - 1].isSliced = true;
  }

  return {
    hand: nextHand,
    drewJoker: drawn.isJoker,
    handData: calculateScoreData(nextHand, true),
  };
};

export const decideNpcAction = ({ npcHand, playerHand, playerStand }) => {
  const npcData = calculateScoreData(npcHand, true);
  const playerData = calculateScoreData(playerHand, false);

  let shouldHit = false;
  if (npcData.score < 17) shouldHit = true;
  else if (npcData.score < playerData.score && npcData.score < 21 && !playerStand) shouldHit = true;

  return {
    shouldHit,
    npcData,
    playerData,
  };
};

export const resolveNpcDrawState = ({ npcHand, drawn }) => {
  const nextDrawn = drawn ? { ...drawn } : null;

  if (nextDrawn?.isJoker) {
    rollNpcJoker(nextDrawn);
  }

  const nextNpcHand = nextDrawn ? appendCardWithScissor(npcHand, nextDrawn) : [...npcHand];

  return {
    drawn: nextDrawn,
    npcHand: nextNpcHand,
    npcData: calculateScoreData(nextNpcHand, true),
  };
};

export const resolveAfterJokerState = ({ currentHand, source, npcStand }) => {
  const nextJoker = currentHand.find((card) => card.isJoker && card.values[0] === 0 && !card.isSliced) || null;

  if (nextJoker) {
    return {
      nextRollingJoker: { ...nextJoker, source },
      nextJokerDiceCount: 1,
      handData: null,
      shouldPassTurnToNpc: false,
    };
  }

  const handData = calculateScoreData(currentHand, true);

  return {
    nextRollingJoker: null,
    nextJokerDiceCount: 1,
    handData,
    shouldPassTurnToNpc: source === 'HIT' && !npcStand && !handData.isBust && handData.score !== 21,
  };
};

export const resolveJokerRollState = ({ rollingJoker, hand, jokerDiceCount }) => {
  let rollSum = 0;
  for (let index = 0; index < jokerDiceCount; index += 1) {
    rollSum += Math.floor(Math.random() * 6) + 1;
  }

  const updatedJoker = {
    ...rollingJoker,
    values: [rollingJoker.values[0] + rollSum],
  };
  updatedJoker.rank = `🃏${updatedJoker.values[0]}`;

  const nextHand = hand.map((card) => (card.id === updatedJoker.id ? updatedJoker : card));
  const handData = calculateScoreData(nextHand, true);

  if (handData.isBust) {
    const bustedJoker = { ...updatedJoker, isSliced: true };
    const bustedHand = nextHand.map((card) => (card.id === bustedJoker.id ? bustedJoker : card));
    return {
      updatedJoker,
      nextHand,
      nextJokerDiceCount: jokerDiceCount + 1,
      handData,
      busted: true,
      bustedHand,
      cleanedHand: bustedHand.filter((card) => !card.isSliced),
    };
  }

  return {
    updatedJoker,
    nextHand,
    nextJokerDiceCount: jokerDiceCount + 1,
    handData,
    busted: false,
    bustedHand: null,
    cleanedHand: null,
  };
};