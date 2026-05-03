import { INITIAL_RANK_POOL, INITIAL_SUIT_POOL, RANK_POOL, SUITS } from '../config';

const faceCardRanks = new Set(['J', 'Q', 'K']);

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
}

export function rankToValue(rank) {
  if (faceCardRanks.has(rank)) {
    return 10;
  }

  if (rank === 'A') {
    return 11;
  }

  return Number.parseInt(rank, 10);
}

export function createCard(suit, rank) {
  const suitDefinition = SUITS.find((entry) => entry.suit === suit);

  return {
    id: createId(),
    suit,
    rank,
    color: suitDefinition?.color ?? 'neutral',
    value: rankToValue(rank),
  };
}

export function shuffleCards(cards, random = Math.random) {
  const nextCards = [...cards];

  for (let currentIndex = nextCards.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(random() * (currentIndex + 1));
    [nextCards[currentIndex], nextCards[randomIndex]] = [nextCards[randomIndex], nextCards[currentIndex]];
  }

  return nextCards;
}

export function generateInitialDeck(random = Math.random) {
  const cards = INITIAL_SUIT_POOL.flatMap((suit) => INITIAL_RANK_POOL.map((rank) => createCard(suit, rank)));

  return shuffleCards(cards, random);
}

export function generateShopOffers(random = Math.random, count = 3) {
  return Array.from({ length: count }, () => {
    const suit = SUITS[Math.floor(random() * SUITS.length)].suit;
    const rank = RANK_POOL[Math.floor(random() * RANK_POOL.length)];
    return createCard(suit, rank);
  });
}

export function calculateScore(hand) {
  let score = 0;
  let aces = 0;

  hand.forEach((card) => {
    score += card.value;
    if (card.rank === 'A') {
      aces += 1;
    }
  });

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
}