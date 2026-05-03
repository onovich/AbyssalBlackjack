import {
  HEAL_COST,
  MAX_HP,
  REMOVE_CARD_COST,
  RESOLVE_DELAY_MS,
  SHOP_CARD_COST,
  TARGETS,
} from '../config';
import { calculateScore, generateInitialDeck, generateShopOffers, shuffleCards } from './cards';

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
    isRemoving: false,
    battleMessage: { text: '', tone: 'neutral' },
    pendingTransition: null,
    resolveDelayMs: RESOLVE_DELAY_MS,
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
  };

  if (calculateScore(nextState.hand) === 21) {
    return resolveBattle(nextState, { reason: 'BLACKJACK' });
  }

  return nextState;
}

export function resolveBattle(state, { reason }) {
  const score = calculateScore(state.hand);
  const target = TARGETS[state.stage];
  const isBust = reason === 'BUST';
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

  return {
    ...state,
    gameState: 'SHOP',
    hand: [],
    shopOffers: generateShopOffers(state.random),
    pendingTransition: null,
    isRemoving: false,
  };
}

export function hit(state) {
  const drawResult = drawCards(1, state.deck, state.discard, state.hand, state.random);
  const nextState = {
    ...state,
    ...drawResult,
    hand: drawResult.hand,
  };
  const score = calculateScore(nextState.hand);

  if (score > 21) {
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