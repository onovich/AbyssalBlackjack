import {
  ENCHANT_OPTION_COUNT,
  HEAL_COST,
  INITIAL_REDRAW_CHARGES,
  INITIAL_STUFF_CHARGES,
  JOKER_ROLL_DELAY_MS,
  MAX_HP,
  MAX_SKILL_CHARGES,
  NPC_TURN_DELAY_MS,
  REMOVE_CARD_COST,
  RESOLVE_DELAY_MS,
  SHOP_CARD_COST,
  SLICE_DELAY_MS,
  TARGETS,
} from '../config';
import {
  applyEnchantToCard,
  calculateScoreData,
  canEnchantCard,
  generateEnchantOptions,
  generateInitialDeck,
  generateNpcDeck,
  generateShopOffers,
  resolveJokerCard,
  shuffleCards,
  updateCardInCollection,
} from './cards';

export function createInitialState(random = Math.random) {
  return {
    random,
    gameState: 'START',
    turn: 'PLAYER',
    pDeck: [],
    pDiscard: [],
    nDeck: [],
    nDiscard: [],
    hand: [],
    npcHand: [],
    hp: MAX_HP,
    coins: 0,
    stage: 0,
    shopOffers: [],
    enchantOptions: [],
    selectedEnchantId: null,
    isRemoving: false,
    isSelectingRedraw: false,
    isSelectingStuff: false,
    redrawCharges: INITIAL_REDRAW_CHARGES,
    skillCharges: INITIAL_STUFF_CHARGES,
    battleMessage: { text: '', tone: 'neutral' },
    pendingTransition: null,
    rollingJoker: null,
    jokerDiceCount: 0,
    jokerRollValue: null,
    resolveDelayMs: RESOLVE_DELAY_MS,
    jokerRollDelayMs: JOKER_ROLL_DELAY_MS,
    npcTurnDelayMs: NPC_TURN_DELAY_MS,
    sliceDelayMs: SLICE_DELAY_MS,
    pendingSliceCleanup: null,
  };
}

function getNextPendingJoker(state) {
  return [...state.hand, ...state.npcHand].find((card) => card.isJoker && !card.isResolvedJoker) ?? null;
}

function enterJokerState(state, card) {
  return {
    ...state,
    rollingJoker: { cardId: card.id, owner: card.owner },
    jokerDiceCount: 0,
    jokerRollValue: null,
    battleMessage: { text: '小丑牌浮出，先掷骰决定它的点数', tone: 'neutral' },
  };
}

function moveDiscardIntoDeck(deck, discard, random) {
  if (deck.length > 0 || discard.length === 0) {
    return { deck, discard };
  }

  return {
    deck: shuffleCards(discard, random),
    discard: [],
  };
}

function drawToOwner({ deck, discard, hand, count, random, owner, hideLastCard = false }) {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const nextHand = [...hand];

  for (let index = 0; index < count; index += 1) {
    const recycled = moveDiscardIntoDeck(nextDeck, nextDiscard, random);
    nextDeck = recycled.deck;
    nextDiscard = recycled.discard;
    if (nextDeck.length === 0) {
      break;
    }

    const drawnCard = nextDeck.pop();
    nextHand.push({
      ...drawnCard,
      owner,
      hidden: hideLastCard && index === count - 1,
    });
  }

  return {
    deck: nextDeck,
    discard: nextDiscard,
    hand: nextHand,
  };
}

function markSliceOnPreviousCard(cards) {
  if (cards.length < 2) {
    return cards;
  }

  const lastIndex = cards.length - 1;
  const previousIndex = cards.length - 2;
  if (!cards[lastIndex].isScissor || cards[previousIndex].isSliced) {
    return cards;
  }

  return cards.map((card, index) => (index === previousIndex ? { ...card, isSliced: true } : card));
}

function applyDrawConsequences(state, owner) {
  const key = owner === 'PLAYER' ? 'hand' : 'npcHand';
  const nextCards = markSliceOnPreviousCard(state[key]);
  let nextState = {
    ...state,
    [key]: nextCards,
  };

  if (nextCards.some((card) => card.isSliced)) {
    nextState = {
      ...nextState,
      pendingSliceCleanup: { owner },
      battleMessage: {
        text: owner === 'PLAYER' ? '剪刀牌切断了上一张手牌' : '庄家的剪刀牌切断了前一张牌',
        tone: 'danger',
      },
    };
  }

  const nextPendingJoker = getNextPendingJoker(nextState);
  if (nextPendingJoker) {
    return enterJokerState(nextState, nextPendingJoker);
  }

  return nextState;
}

function revealNpcHand(npcHand) {
  return npcHand.map((card) => ({ ...card, hidden: false }));
}

function stashHands(state) {
  return {
    ...state,
    pDiscard: [...state.pDiscard, ...state.hand.map((card) => ({ ...card, hidden: false, isSliced: false }))],
    nDiscard: [...state.nDiscard, ...state.npcHand.map((card) => ({ ...card, hidden: false, isSliced: false }))],
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
  const pDeck = generateInitialDeck(state.random, 'PLAYER');
  const nextState = {
    ...createInitialState(state.random),
    gameState: 'BATTLE',
    pDeck,
    hp: MAX_HP,
    coins: 0,
    stage: 0,
  };

  return startStage(nextState);
}

export function startStage(state) {
  const nDeckSeed = generateNpcDeck(state.stage, state.random);
  const playerDraw = drawToOwner({
    deck: state.pDeck,
    discard: state.pDiscard,
    hand: [],
    count: 2,
    random: state.random,
    owner: 'PLAYER',
  });
  const npcDraw = drawToOwner({
    deck: nDeckSeed,
    discard: [],
    hand: [],
    count: 2,
    random: state.random,
    owner: 'NPC',
    hideLastCard: true,
  });

  let nextState = {
    ...state,
    gameState: 'BATTLE',
    turn: 'PLAYER',
    pDeck: playerDraw.deck,
    pDiscard: playerDraw.discard,
    nDeck: npcDraw.deck,
    nDiscard: npcDraw.discard,
    hand: playerDraw.hand,
    npcHand: npcDraw.hand,
    battleMessage: { text: '', tone: 'neutral' },
    pendingTransition: null,
    isRemoving: false,
    isSelectingRedraw: false,
    isSelectingStuff: false,
    rollingJoker: null,
    jokerDiceCount: 0,
    jokerRollValue: null,
    pendingSliceCleanup: null,
    redrawCharges: Math.min(MAX_SKILL_CHARGES, Math.max(INITIAL_REDRAW_CHARGES, state.redrawCharges ?? INITIAL_REDRAW_CHARGES)),
    skillCharges: Math.min(MAX_SKILL_CHARGES, Math.max(INITIAL_STUFF_CHARGES, state.skillCharges ?? INITIAL_STUFF_CHARGES)),
  };

  nextState = applyDrawConsequences(nextState, 'PLAYER');
  nextState = applyDrawConsequences(nextState, 'NPC');

  const pendingJoker = getNextPendingJoker(nextState);
  if (pendingJoker) {
    return enterJokerState(nextState, pendingJoker);
  }

  if (calculateScoreData(nextState.hand, true).score === 21) {
    return resolveBattle(nextState, { reason: 'BLACKJACK' });
  }

  return nextState;
}

export function resolveBattle(state, { reason }) {
  const playerScoreData = calculateScoreData(state.hand, true);
  const npcVisibleHand = revealNpcHand(state.npcHand);
  const npcScoreData = calculateScoreData(npcVisibleHand, true);
  const playerScore = playerScoreData.score;
  const npcScore = npcScoreData.score;
  const isBlackjack = reason === 'BLACKJACK';

  let won = false;
  if (reason === 'BUST') {
    won = false;
  } else if (reason === 'NPC_BUST') {
    won = true;
  } else if (isBlackjack) {
    won = true;
  } else {
    won = !playerScoreData.isBust && (npcScoreData.isBust || playerScore > npcScore);
  }

  const hpLoss = won ? 0 : 1;
  const coinGain = won ? (isBlackjack ? 5 : 4) : 0;

  let message = '';
  let tone = 'neutral';

  if (reason === 'BUST' || playerScoreData.isBust) {
    message = `你爆牌了！点数 ${playerScore}`;
    tone = 'danger';
  } else if (reason === 'NPC_BUST' || npcScoreData.isBust) {
    message = `庄家爆牌！你以 ${playerScore} 点胜出`;
    tone = 'success';
  } else if (won) {
    message = isBlackjack ? '黑杰克！完美通过' : `胜利！${playerScore} 点压过庄家的 ${npcScore} 点`;
    tone = 'success';
  } else {
    message = `失败！你的 ${playerScore} 点不敌庄家的 ${npcScore} 点`;
    tone = 'danger';
  }

  const nextHp = state.hp - hpLoss;
  const nextCoins = state.coins + coinGain;
  const hasFinalStage = state.stage >= TARGETS.length - 1;

  let pendingTransition = 'SHOP';
  if (nextHp <= 0) {
    pendingTransition = 'OVER';
  } else if (won && hasFinalStage) {
    pendingTransition = 'WIN';
  }

  return stashHands({
    ...state,
    gameState: 'RESOLVE',
    turn: 'PLAYER',
    hp: nextHp,
    coins: nextCoins,
    hand: [...state.hand],
    npcHand: npcVisibleHand,
    battleMessage: { text: message, tone },
    pendingTransition,
    isRemoving: false,
    isSelectingRedraw: false,
    isSelectingStuff: false,
    rollingJoker: null,
    jokerDiceCount: 0,
    jokerRollValue: null,
    pendingSliceCleanup: null,
  });
}

export function finishResolve(state) {
  if (state.pendingTransition === 'OVER') {
    return {
      ...state,
      gameState: 'OVER',
      hand: [],
      npcHand: [],
      pendingTransition: null,
    };
  }

  if (state.pendingTransition === 'WIN') {
    return {
      ...state,
      gameState: 'WIN',
      hand: [],
      npcHand: [],
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
  const drawResult = drawToOwner({
    deck: state.pDeck,
    discard: state.pDiscard,
    hand: state.hand,
    count: 1,
    random: state.random,
    owner: 'PLAYER',
  });
  let nextState = {
    ...state,
    pDeck: drawResult.deck,
    pDiscard: drawResult.discard,
    hand: drawResult.hand,
  };
  nextState = applyDrawConsequences(nextState, 'PLAYER');

  if (nextState.rollingJoker) {
    return nextState;
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

export function stand(state) {
  return {
    ...state,
    turn: 'NPC',
    battleMessage: { text: '庄家开始行动', tone: 'neutral' },
    isSelectingRedraw: false,
    isSelectingStuff: false,
  };
}

export function rollJoker(state) {
  if (!state.rollingJoker) {
    return state;
  }

  const rolledValue = Math.floor(state.random() * 6) + 1 + Math.floor(state.random() * 6) + 1;

  const targetCollection = state.rollingJoker.owner === 'NPC' ? 'npcHand' : 'hand';

  return {
    ...state,
    [targetCollection]: updateCardInCollection(state[targetCollection], state.rollingJoker.cardId, (card) => resolveJokerCard(card, rolledValue)),
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
    battleMessage: {
      text: `${state.rollingJoker.owner === 'NPC' ? '庄家' : '你的'}小丑牌定格为 ${state.jokerRollValue} 点`,
      tone: 'neutral',
    },
  };
  const nextPendingJoker = getNextPendingJoker(nextState);

  if (nextPendingJoker) {
    return enterJokerState(nextState, nextPendingJoker);
  }

  if (state.rollingJoker.owner === 'PLAYER') {
    const scoreData = calculateScoreData(nextState.hand, true);
    if (scoreData.isBust) {
      return resolveBattle(nextState, { reason: 'BUST' });
    }

    if (scoreData.score === 21) {
      return resolveBattle(nextState, { reason: 'BLACKJACK' });
    }

    return nextState;
  }

  return nextState;
}

export function npcTakeTurn(state) {
  if (state.turn !== 'NPC' || state.rollingJoker) {
    return state;
  }

  const revealedHand = revealNpcHand(state.npcHand);
  let nextState = {
    ...state,
    npcHand: revealedHand,
  };

  const npcScoreData = calculateScoreData(nextState.npcHand, true);
  const playerScoreData = calculateScoreData(nextState.hand, false);

  if (npcScoreData.isBust) {
    return resolveBattle(nextState, { reason: 'NPC_BUST' });
  }

  const shouldHit = npcScoreData.score < 17 || npcScoreData.score < playerScoreData.score;
  if (!shouldHit) {
    return resolveBattle(nextState, { reason: 'SHOWDOWN' });
  }

  const drawResult = drawToOwner({
    deck: nextState.nDeck,
    discard: nextState.nDiscard,
    hand: nextState.npcHand,
    count: 1,
    random: nextState.random,
    owner: 'NPC',
  });

  nextState = {
    ...nextState,
    nDeck: drawResult.deck,
    nDiscard: drawResult.discard,
    npcHand: drawResult.hand,
    battleMessage: { text: '庄家补了一张牌', tone: 'neutral' },
  };
  nextState = applyDrawConsequences(nextState, 'NPC');

  if (nextState.rollingJoker) {
    return nextState;
  }

  const nextNpcScoreData = calculateScoreData(nextState.npcHand, true);
  if (nextNpcScoreData.isBust) {
    return resolveBattle(nextState, { reason: 'NPC_BUST' });
  }

  return nextState;
}

export function cleanupSlicedCards(state) {
  if (!state.pendingSliceCleanup) {
    return state;
  }

  const key = state.pendingSliceCleanup.owner === 'PLAYER' ? 'hand' : 'npcHand';

  return {
    ...state,
    [key]: state[key].filter((card) => !card.isSliced),
    pendingSliceCleanup: null,
  };
}

export function toggleRedrawMode(state) {
  if (state.gameState !== 'BATTLE' || state.turn !== 'PLAYER' || state.redrawCharges <= 0) {
    return state;
  }

  return {
    ...state,
    isSelectingRedraw: !state.isSelectingRedraw,
    isSelectingStuff: false,
    battleMessage: {
      text: !state.isSelectingRedraw ? '选择一张手牌进行重抽' : '',
      tone: 'neutral',
    },
  };
}

export function executeRedraw(state, cardId) {
  if (!state.isSelectingRedraw || state.redrawCharges <= 0 || state.turn !== 'PLAYER') {
    return state;
  }

  const targetIndex = state.hand.findIndex((card) => card.id === cardId);
  if (targetIndex === -1) {
    return state;
  }

  const remainingHand = state.hand.filter((card) => card.id !== cardId);
  const drawResult = drawToOwner({
    deck: state.pDeck,
    discard: state.pDiscard,
    hand: [],
    count: 1,
    random: state.random,
    owner: 'PLAYER',
  });
  const replacement = drawResult.hand[0];
  if (!replacement) {
    return {
      ...state,
      isSelectingRedraw: false,
    };
  }

  const rebuiltHand = [...remainingHand];
  rebuiltHand.splice(targetIndex, 0, replacement);

  let nextState = {
    ...state,
    pDeck: drawResult.deck,
    pDiscard: drawResult.discard,
    hand: rebuiltHand,
    redrawCharges: Math.max(0, state.redrawCharges - 1),
    isSelectingRedraw: false,
    isSelectingStuff: false,
    battleMessage: { text: '重抽完成', tone: 'neutral' },
  };
  nextState = applyDrawConsequences(nextState, 'PLAYER');

  if (nextState.rollingJoker) {
    return nextState;
  }

  const scoreData = calculateScoreData(nextState.hand, true);
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
    pDiscard: [...state.pDiscard, { ...card, owner: 'PLAYER' }],
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

  if (location !== 'pDeck' && location !== 'pDiscard') {
    return state;
  }

  const source = state[location];
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
    turn: 'PLAYER',
    shopOffers: [],
    isRemoving: false,
    isSelectingRedraw: false,
    isSelectingStuff: false,
    battleMessage: { text: '', tone: 'neutral' },
    redrawCharges: Math.min(MAX_SKILL_CHARGES, state.redrawCharges + 1),
    skillCharges: Math.min(MAX_SKILL_CHARGES, state.skillCharges + 1),
  });
}

export function toggleStuffMode(state) {
  if (state.gameState !== 'BATTLE' || state.turn !== 'PLAYER' || state.skillCharges <= 0) {
    return state;
  }

  return {
    ...state,
    isSelectingStuff: !state.isSelectingStuff,
    isSelectingRedraw: false,
    battleMessage: {
      text: !state.isSelectingStuff ? '选择一张手牌，把新牌塞到它后面' : '',
      tone: 'neutral',
    },
  };
}

export function executeStuff(state, cardId) {
  if (!state.isSelectingStuff || state.skillCharges <= 0 || state.turn !== 'PLAYER') {
    return state;
  }

  const targetIndex = state.hand.findIndex((card) => card.id === cardId);
  if (targetIndex === -1) {
    return state;
  }

  const drawResult = drawToOwner({
    deck: state.pDeck,
    discard: state.pDiscard,
    hand: [],
    count: 1,
    random: state.random,
    owner: 'PLAYER',
  });
  const stuffedCard = drawResult.hand[0];
  if (!stuffedCard) {
    return {
      ...state,
      isSelectingStuff: false,
    };
  }

  const rebuiltHand = [...state.hand];
  rebuiltHand.splice(targetIndex + 1, 0, stuffedCard);

  let nextState = {
    ...state,
    pDeck: drawResult.deck,
    pDiscard: drawResult.discard,
    hand: rebuiltHand,
    skillCharges: Math.max(0, state.skillCharges - 1),
    isSelectingStuff: false,
    battleMessage: { text: '塞牌完成', tone: 'neutral' },
  };
  nextState = applyDrawConsequences(nextState, 'PLAYER');

  if (nextState.rollingJoker) {
    return nextState;
  }

  const scoreData = calculateScoreData(nextState.hand, true);
  if (scoreData.isBust) {
    return resolveBattle(nextState, { reason: 'BUST' });
  }

  if (scoreData.score === 21) {
    return resolveBattle(nextState, { reason: 'BLACKJACK' });
  }

  return nextState;
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

  if (location !== 'pDeck' && location !== 'pDiscard') {
    return state;
  }

  const source = state[location];
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