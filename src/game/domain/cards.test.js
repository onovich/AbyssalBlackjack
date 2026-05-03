import { describe, expect, it } from 'vitest';
import { calculateScoreData, generateInitialDeck } from './cards';

const makeCard = ({
  id = 'card',
  suit = '♥',
  color = 'text-red-600',
  rank = '2',
  values = [2],
  isJoker = false,
  hidden = false,
  isSliced = false,
  owner = 'PLAYER',
} = {}) => ({
  id,
  suit,
  color,
  rank,
  baseRank: rank,
  baseValues: values,
  values,
  isScissor: false,
  isJoker,
  hidden,
  isSliced,
  owner,
});

describe('cards.calculateScoreData', () => {
  it('correctly scores ace hands with flush bonus', () => {
    const hand = [
      makeCard({ id: 'a', rank: 'A', values: [1, 11] }),
      makeCard({ id: 'b', rank: '9', values: [9] }),
    ];

    expect(calculateScoreData(hand, true)).toEqual({
      score: 21,
      isFlush: true,
      isBust: false,
    });
  });

  it('ignores hidden cards unless calculateAll is enabled', () => {
    const visible = makeCard({ id: 'a', rank: '10', suit: '♠', color: 'text-slate-800', values: [10] });
    const hidden = makeCard({ id: 'b', rank: 'K', suit: '♣', color: 'text-slate-800', values: [10], hidden: true });

    expect(calculateScoreData([visible, hidden], false)).toEqual({
      score: 10,
      isFlush: false,
      isBust: false,
    });

    expect(calculateScoreData([visible, hidden], true)).toEqual({
      score: 20,
      isFlush: false,
      isBust: false,
    });
  });

  it('treats sliced cards as removed from scoring', () => {
    const active = makeCard({ id: 'a', rank: '10', values: [10] });
    const sliced = makeCard({ id: 'b', rank: 'K', values: [10], isSliced: true });

    expect(calculateScoreData([active, sliced], true)).toEqual({
      score: 10,
      isFlush: false,
      isBust: false,
    });
  });
});

describe('cards.generateInitialDeck', () => {
  it('builds the expected starting deck shape', () => {
    const deck = generateInitialDeck('NPC');

    expect(deck).toHaveLength(15);
    expect(deck.filter((card) => card.isJoker)).toHaveLength(1);
    expect(deck.every((card) => card.owner === 'NPC')).toBe(true);
    expect(deck.filter((card) => ['♠', '♥', '🃏'].includes(card.suit))).toHaveLength(15);
  });
});