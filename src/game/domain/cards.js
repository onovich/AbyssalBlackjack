import { MAX_STAGES, SUITS } from '../constants';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const createCard = (suitObj, rank, valuesOverride = null, isScissor = false, isJoker = false, owner = 'PLAYER') => {
  let baseVals = valuesOverride;
  if (!baseVals) {
    if (isJoker || rank === 'JOKER') baseVals = [0];
    else if (['J', 'Q', 'K'].includes(rank)) baseVals = [10];
    else if (rank === 'A') baseVals = [1, 11];
    else baseVals = [parseInt(rank)];
  }
  return {
    id: generateId(),
    suit: suitObj.suit,
    color: suitObj.color,
    rank,
    baseRank: rank,
    baseValues: baseVals,
    values: baseVals,
    isScissor,
    isJoker: isJoker || rank === 'JOKER',
    hidden: false,
    isSliced: false,
    owner,
  };
};

export const shuffle = (array) => {
  let currentIndex = array.length;
  let randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

export const generateInitialDeck = (owner) => {
  const deck = [];
  ['♠', '♥'].forEach((suit) => {
    const suitObj = SUITS.find((entry) => entry.suit === suit);
    ['A', '2', '3', '4', '5', '6', '7'].forEach((rank) => {
      deck.push(createCard(suitObj, rank, null, false, false, owner));
    });
  });
  deck.push(createCard({ suit: '🃏', color: 'text-purple-500' }, 'JOKER', [0], false, true, owner));
  return shuffle(deck);
};

export const generateShopCards = () => {
  const cards = [];
  const pool = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'JOKER'];
  for (let index = 0; index < 3; index += 1) {
    const rank = pool[Math.floor(Math.random() * pool.length)];
    if (rank === 'JOKER') {
      cards.push(createCard({ suit: '🃏', color: 'text-purple-500' }, 'JOKER', [0], false, true, 'PLAYER'));
    } else {
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
      cards.push(createCard(suit, rank, null, false, false, 'PLAYER'));
    }
  }
  return cards;
};

export const generateNpcScalingCard = () => {
  const pool = ['8', '9', '10', 'J', 'Q', 'K', 'A', 'JOKER'];
  const rank = pool[Math.floor(Math.random() * pool.length)];
  if (rank === 'JOKER') {
    return createCard({ suit: '🃏', color: 'text-purple-500' }, 'JOKER', [0], false, true, 'NPC');
  }
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return createCard(suit, rank, null, false, false, 'NPC');
};

export const calculateScoreData = (hand, calculateAll = false) => {
  const activeHand = hand.filter((card) => !card.isSliced && (calculateAll ? true : !card.hidden));
  if (activeHand.length === 0) return { score: 0, isFlush: false, isBust: false };

  let isFlush = false;
  if (activeHand.length >= 2) {
    const firstSuit = activeHand[0].suit;
    isFlush = activeHand.every((card) => card.suit === firstSuit);
  }

  let sums = [0];
  activeHand.forEach((card) => {
    const newSums = [];
    sums.forEach((sum) => {
      card.values.forEach((value) => {
        newSums.push(sum + value);
      });
    });
    sums = Array.from(new Set(newSums));
  });

  let finalSums = [...sums];
  if (isFlush) {
    sums.forEach((sum) => {
      finalSums.push(sum + 1);
      finalSums.push(sum - 1);
    });
    finalSums = Array.from(new Set(finalSums));
  }

  const valid = finalSums.filter((sum) => sum <= 21);
  const isBust = valid.length === 0;
  const score = isBust ? Math.min(...finalSums) : Math.max(...valid);

  return { score, isFlush, isBust };
};

export const getInitialGameValues = () => ({
  hp: 5,
  coins: 0,
  stage: 1,
  maxStages: MAX_STAGES,
});