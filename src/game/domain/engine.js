import {
  ENCHANT_OPTION_COUNT,
  HEAL_COST,
  JOKER_ROLL_DELAY_MS,
  MAX_HP,
  REMOVE_CARD_COST,
  RESOLVE_DELAY_MS,
  SHOP_CARD_COST,
  TARGETS,
} from '../config';
import {
  applyEnchantToCard,
  calculateScoreData,
  canEnchantCard,
  generateEnchantOptions,
  generateInitialDeck,
  generateShopOffers,
  resolveJokerCard,
  shuffleCards,
  updateCardInCollection,
} from './cards';

export function createInitialState(random = Math.random) {
  return {
    random,
    gameState: 'START',
    deck: [],
    discard: [],
    hand: [],
    hp: MAX_HP,
    coins: 0,
    stage: 0,
    shopOffers: [],
    enchantOptions: [],
    selectedEnchantId: null,
    isRemoving: false,
    battleMessage: { text: '', tone: 'neutral' },
    pendingTransition: null,
    rollingJoker: null,
    jokerDiceCount: 0,
    jokerRollValue: null,
    resolveDelayMs: RESOLVE_DELAY_MS,
    jokerRollDelayMs: JOKER_ROLL_DELAY_MS,
  };
}

function getNextPendingJoker(hand) {
  return hand.find((card) => card.isJoker && !card.isResolvedJoker) ?? null;
}

function enterJokerState(state, card) {
  return {
    ...state,
    rollingJoker: { cardId: card.id },
    jokerDiceCount: 0,
    jokerRollValue: null,
    battleMessage: { text: '小丑牌浮出，先掷骰决定它的点数', tone: 'neutral' },
  };
}

function openEnchantPhase(state) {
  return {
    ...state,
    gameState: 'ENCHANT',
    hand: [],
    enchantOptions: generateEnchantOptions(state.random).slice(0, ENCHANT_OPTION_COUNT),
    selectedEnchantId: null,
    shopOffers: [],
  };
}

export function drawCards(count, deck, discard, hand, random = Math.random) {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const nextHand = [...hand];

  for (let index = 0; index < count; index += 1) {
    if (nextDeck.length === 0) {
      if (nextDiscard.length === 0) {
        break;
      }

      nextDeck = shuffleCards(nextDiscard, random);
      nextDiscard = [];
    }

    const card = nextDeck.pop();
    if (card) {
      nextHand.push(card);
    }
  }

  return {
    deck: nextDeck,
    discard: nextDiscard,
    hand: nextHand,
  };
}

export function beginRun(state) {
  const deck = generateInitialDeck(state.random);
  const nextState = {
    ...createInitialState(state.random),
    gameState: 'BATTLE',
    deck,
    hp: MAX_HP,
    coins: 0,
    stage: 0,
  };

  return startStage(nextState);
}

export function startStage(state) {
  const drawResult = drawCards(2, state.deck, state.discard, [], state.random);
  const nextState = {
    ...state,
    ...drawResult,
    hand: drawResult.hand,
    gameState: 'BATTLE',
    battleMessage: { text: '', tone: 'neutral' },
    pendingTransition: null,
    isRemoving: false,
    rollingJoker: null,
    jokerDiceCount: 0,
    jokerRollValue: null,
  };

  const pendingJoker = getNextPendingJoker(nextState.hand);
  if (pendingJoker) {
    return enterJokerState(nextState, pendingJoker);
  }

  if (calculateScoreData(nextState.hand).score === 21) {
    return resolveBattle(nextState, { reason: 'BLACKJACK' });
  }

  return nextState;
}

export function resolveBattle(state, { reason }) {
  const scoreData = calculateScoreData(state.hand);
  const score = scoreData.score;
  const target = TARGETS[state.stage];
  const isBust = reason === 'BUST' || scoreData.isBust;
  const isBlackjack = reason === 'BLACKJACK';
  const won = !isBust && score >= target;
  const hpLoss = won ? 0 : 1;
  const coinGain = won ? (isBlackjack ? 5 : 4) : 0;

  let message = '';
  let tone = 'neutral';

  if (isBust) {
    message = `爆牌了！点数 ${score}`;
    tone = 'danger';
  } else if (won) {
    message = isBlackjack ? `黑杰克！完美通过` : `胜利！${score} 点 ≥ 目标 ${target}`;
    tone = 'success';
  } else {
    message = `失败！${score} 点 < 目标 ${target}`;
    tone = 'danger';
  }

  const nextHp = state.hp - hpLoss;
  const nextCoins = state.coins + coinGain;
  const nextDiscard = [...state.discard, ...state.hand];
  const hasFinalStage = state.stage >= TARGETS.length - 1;

  let pendingTransition = 'SHOP';
  if (nextHp <= 0) {
    pendingTransition = 'OVER';
  } else if (won && hasFinalStage) {
    pendingTransition = 'WIN';
  }

  return {
    ...state,
    gameState: 'RESOLVE',
    hp: nextHp,
    coins: nextCoins,
    discard: nextDiscard,
    hand: [...state.hand],
    battleMessage: { text: message, tone },
    pendingTransition,
    isRemoving: false,
    rollingJoker: null,
    jokerDiceCount: 0,
    jokerRollValue: null,
  };
}

export function finishResolve(state) {
  if (state.pendingTransition === 'OVER') {
    return {
      ...state,
      gameState: 'OVER',
      hand: [],
      pendingTransition: null,
    };
  }

  if (state.pendingTransition === 'WIN') {
    return {
      ...state,
      gameState: 'WIN',
      hand: [],
      pendingTransition: null,
    };
  }

  return openEnchantPhase({
    ...state,
    pendingTransition: null,
    isRemoving: false,
  });
}

export function hit(state) {
  const drawResult = drawCards(1, state.deck, state.discard, state.hand, state.random);
  const nextState = {
    ...state,
    ...drawResult,
    hand: drawResult.hand,
  };
  const pendingJoker = getNextPendingJoker(nextState.hand);
  if (pendingJoker) {
    return enterJokerState(nextState, pendingJoker);
  }

  const scoreData = calculateScoreData(nextState.hand);
  const score = scoreData.score;

  if (scoreData.isBust) {
    return resolveBattle(nextState, { reason: 'BUST' });
  }

  if (score === 21) {
    return resolveBattle(nextState, { reason: 'BLACKJACK' });
  }

  return nextState;
}

export function stand(state) {
  return resolveBattle(state, { reason: 'STAND' });
}

export function rollJoker(state) {
  if (!state.rollingJoker) {
    return state;
  }

  const rolledValue = Math.floor(state.random() * 6) + 1;

  return {
    ...state,
    hand: updateCardInCollection(state.hand, state.rollingJoker.cardId, (card) => resolveJokerCard(card, rolledValue)),
    jokerDiceCount: state.jokerDiceCount + 1,
    jokerRollValue: rolledValue,
  };
}

export function acceptJoker(state) {
  if (!state.rollingJoker || !state.jokerRollValue) {
    return state;
  }

  const nextState = {
    ...state,
    rollingJoker: null,
    battleMessage: { text: `小丑牌定格为 ${state.jokerRollValue} 点`, tone: 'neutral' },
  };
  const nextPendingJoker = getNextPendingJoker(nextState.hand);

  if (nextPendingJoker) {
    return enterJokerState(nextState, nextPendingJoker);
  }

  const scoreData = calculateScoreData(nextState.hand);
  if (scoreData.isBust) {
    return resolveBattle(nextState, { reason: 'BUST' });
  }

  if (scoreData.score === 21) {
    return resolveBattle(nextState, { reason: 'BLACKJACK' });
  }

  return nextState;
}

export function buyCard(state, offerIndex) {
  if (state.coins < SHOP_CARD_COST) {
    return state;
  }

  const card = state.shopOffers[offerIndex];
  if (!card) {
    return state;
  }

  return {
    ...state,
    coins: state.coins - SHOP_CARD_COST,
    discard: [...state.discard, card],
    shopOffers: state.shopOffers.filter((_, index) => index !== offerIndex),
  };
}

export function heal(state) {
  if (state.coins < HEAL_COST || state.hp >= MAX_HP) {
    return state;
  }

  return {
    ...state,
    hp: state.hp + 1,
    coins: state.coins - HEAL_COST,
  };
}

export function toggleRemoveMode(state) {
  if (state.coins < REMOVE_CARD_COST && !state.isRemoving) {
    return state;
  }

  return {
    ...state,
    isRemoving: !state.isRemoving,
  };
}

export function removeCard(state, cardId, location) {
  if (!state.isRemoving || state.coins < REMOVE_CARD_COST) {
    return state;
  }

  if (location !== 'deck' && location !== 'discard') {
    return state;
  }

  const source = location === 'deck' ? state.deck : state.discard;
  if (!source.some((card) => card.id === cardId)) {
    return state;
  }

  return {
    ...state,
    coins: state.coins - REMOVE_CARD_COST,
    [location]: source.filter((card) => card.id !== cardId),
    isRemoving: false,
  };
}

export function goToNextStage(state) {
  const nextStageValue = state.stage + 1;

  return startStage({
    ...state,
    stage: nextStageValue,
    gameState: 'BATTLE',
    shopOffers: [],
    isRemoving: false,
    battleMessage: { text: '', tone: 'neutral' },
  });
}

export function selectEnchant(state, enchantmentId) {
  if (state.gameState !== 'ENCHANT') {
    return state;
  }

  return {
    ...state,
    selectedEnchantId: enchantmentId,
  };
}

export function applyEnchant(state, cardId, location) {
  if (state.gameState !== 'ENCHANT' || !state.selectedEnchantId) {
    return state;
  }

  const enchantment = state.enchantOptions.find((option) => option.id === state.selectedEnchantId);
  if (!enchantment) {
    return state;
  }

  if (location !== 'deck' && location !== 'discard') {
    return state;
  }

  const source = location === 'deck' ? state.deck : state.discard;
  const targetCard = source.find((card) => card.id === cardId);
  if (!targetCard || !canEnchantCard(targetCard)) {
    return state;
  }

  return {
    ...state,
    [location]: updateCardInCollection(source, cardId, (card) => applyEnchantToCard(card, enchantment)),
    selectedEnchantId: null,
    enchantOptions: [],
    gameState: 'SHOP',
    shopOffers: generateShopOffers(state.random),
    battleMessage: { text: `附魔完成：${targetCard.baseRank} 获得 +${enchantment.bonus}`, tone: 'success' },
  };
}

export function skipEnchant(state) {
  if (state.gameState !== 'ENCHANT') {
    return state;
  }

  return {
    ...state,
    gameState: 'SHOP',
    selectedEnchantId: null,
    enchantOptions: [],
    shopOffers: generateShopOffers(state.random),
  };
}