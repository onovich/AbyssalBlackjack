import {
  ENCHANT_BONUS_POOL,
  ENCHANT_OPTION_COUNT,
  INITIAL_RANK_POOL,
  INITIAL_SUIT_POOL,
  JOKER_SHOP_CHANCE,
  RANK_POOL,
  SCISSOR_SHOP_CHANCE,
  SUITS,
} from '../config';

const faceCardRanks = new Set(['J', 'Q', 'K']);

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
}

export function rankToValues(rank) {
  if (faceCardRanks.has(rank)) {
    return [10];
  }

  if (rank === 'A') {
    return [1, 11];
  }

  return [Number.parseInt(rank, 10)];
}

export function getCardDisplayRank(baseRank, values, isJoker = false) {
  if (isJoker) {
    return values[0] ? `🃏${values[0]}` : '🃏?';
  }

  const normalizedValues = [...new Set(values)].sort((left, right) => left - right);
  const trailingValues = normalizedValues.filter((value) => !rankToValues(baseRank).includes(value));

  if (trailingValues.length === 0) {
    return baseRank;
  }

  return `${baseRank}/${trailingValues.join('/')}`;
}

export function createCard(suit, rank, overrides = {}) {
  const suitDefinition = SUITS.find((entry) => entry.suit === suit);
  const values = overrides.values ?? rankToValues(rank);
  const isJoker = overrides.isJoker ?? false;
  const baseRank = overrides.baseRank ?? rank;

  return {
    id: createId(),
    suit,
    rank,
    baseRank,
    color: overrides.color ?? suitDefinition?.color ?? 'neutral',
    values,
    baseValues: overrides.baseValues ?? rankToValues(baseRank),
    displayRank: overrides.displayRank ?? getCardDisplayRank(baseRank, values, isJoker),
    isJoker,
    isResolvedJoker: overrides.isResolvedJoker ?? !isJoker,
    isScissor: overrides.isScissor ?? false,
    hidden: overrides.hidden ?? false,
    isSliced: overrides.isSliced ?? false,
    owner: overrides.owner ?? 'PLAYER',
    enchantments: overrides.enchantments ?? [],
  };
}

export function createJokerCard() {
  return createCard('🃏', 'JOKER', {
    color: 'joker',
    values: [0],
    baseValues: [0],
    isJoker: true,
    isResolvedJoker: false,
    displayRank: '🃏?',
  });
}

export function createScissorCard(owner = 'PLAYER') {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)].suit;

  return createCard(suit, '✂', {
    baseRank: '✂',
    color: 'scissor',
    values: [0],
    baseValues: [0],
    displayRank: '✂',
    isScissor: true,
    owner,
  });
}

export function shuffleCards(cards, random = Math.random) {
  const nextCards = [...cards];

  for (let currentIndex = nextCards.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(random() * (currentIndex + 1));
    [nextCards[currentIndex], nextCards[randomIndex]] = [nextCards[randomIndex], nextCards[currentIndex]];
  }

  return nextCards;
}

export function generateInitialDeck(random = Math.random, owner = 'PLAYER') {
  const cards = INITIAL_SUIT_POOL.flatMap((suit) => INITIAL_RANK_POOL.map((rank) => createCard(suit, rank, { owner })));

  return shuffleCards(cards, random);
}

export function generateNpcDeck(stage, random = Math.random) {
  const poolLimit = Math.min(RANK_POOL.length, 6 + stage);
  const pool = RANK_POOL.slice(0, poolLimit);
  const cards = Array.from({ length: 10 }, () => {
    const suit = SUITS[Math.floor(random() * SUITS.length)].suit;
    const rank = pool[Math.floor(random() * pool.length)];
    return createCard(suit, rank, { owner: 'NPC' });
  });

  return shuffleCards(cards, random);
}

export function generateShopOffers(random = Math.random, count = 3) {
  return Array.from({ length: count }, () => {
    if (random() < JOKER_SHOP_CHANCE) {
      return { ...createJokerCard(), owner: 'PLAYER' };
    }

    if (random() < SCISSOR_SHOP_CHANCE) {
      return createScissorCard('PLAYER');
    }

    const suit = SUITS[Math.floor(random() * SUITS.length)].suit;
    const rank = RANK_POOL[Math.floor(random() * RANK_POOL.length)];
    return createCard(suit, rank, { owner: 'PLAYER' });
  });
}

function cartesianSums(valueGroups) {
  return valueGroups.reduce(
    (sums, group) => sums.flatMap((sum) => group.map((value) => sum + value)),
    [0],
  );
}

export function calculateScoreData(hand, calculateAll = false) {
  if (hand.length === 0) {
    return {
      score: 0,
      isBust: false,
      isFlush: false,
      allTotals: [0],
    };
  }

  const visibleCards = hand.filter((card) => !card.isSliced && (calculateAll || !card.hidden));
  if (visibleCards.length === 0) {
    return {
      score: 0,
      isBust: false,
      isFlush: false,
      allTotals: [0],
    };
  }

  const allSums = cartesianSums(visibleCards.map((card) => card.values));
  const flushSuit = visibleCards[0]?.suit;
  const isFlush =
    visibleCards.length > 1 &&
    Boolean(flushSuit) &&
    visibleCards.every((card) => !card.isJoker && card.suit === flushSuit);

  const totals = isFlush
    ? [...new Set([...allSums, ...allSums.map((sum) => sum + 1), ...allSums.map((sum) => sum - 1)])]
    : [...new Set(allSums)];
  const validTotals = totals.filter((sum) => sum <= 21);
  const score = validTotals.length > 0 ? Math.max(...validTotals) : Math.min(...totals);

  return {
    score,
    isBust: validTotals.length === 0,
    isFlush,
    allTotals: totals.sort((left, right) => left - right),
  };
}

export function calculateScore(hand) {
  return calculateScoreData(hand).score;
}

export function generateEnchantOptions(random = Math.random) {
  return Array.from({ length: ENCHANT_OPTION_COUNT }, (_, index) => {
    const bonus = ENCHANT_BONUS_POOL[Math.floor(random() * ENCHANT_BONUS_POOL.length)];

    return {
      id: `enchant-${index}-${bonus}-${Math.floor(random() * 10000)}`,
      bonus,
      label: `附着 +${bonus}`,
      description: `为一张卡牌增加一个额外点数 ${bonus}`,
    };
  });
}

export function canEnchantCard(card) {
  return !card.isJoker;
}

export function applyEnchantToCard(card, enchantment) {
  if (!canEnchantCard(card)) {
    return card;
  }

  const currentValues = [...new Set(card.values)].sort((left, right) => left - right);
  const baseAnchor = Math.max(...card.baseValues);
  const nextValue = Math.min(21, baseAnchor + enchantment.bonus);
  const nextValues = [...new Set([...currentValues, nextValue])].sort((left, right) => left - right);

  return {
    ...card,
    values: nextValues,
    enchantments: [...card.enchantments, enchantment],
    displayRank: getCardDisplayRank(card.baseRank, nextValues),
  };
}

export function resolveJokerCard(card, rolledValue) {
  return {
    ...card,
    values: [rolledValue],
    isResolvedJoker: true,
    rank: getCardDisplayRank(card.baseRank, [rolledValue], true),
    displayRank: getCardDisplayRank(card.baseRank, [rolledValue], true),
  };
}

export function updateCardInCollection(cards, cardId, updater) {
  return cards.map((card) => (card.id === cardId ? updater(card) : card));
}