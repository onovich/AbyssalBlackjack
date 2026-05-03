// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProgressionFlow } from './useProgressionFlow';

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
  baseRank: isJoker ? 'JOKER' : rank,
  baseValues: isJoker ? [0] : values,
  values,
  isScissor: false,
  isJoker,
  hidden,
  isSliced,
  owner,
});

const createProps = (overrides = {}) => ({
  hp: 5,
  stage: 2,
  coins: 0,
  hand: [],
  pDeck: [],
  pDiscard: [],
  nDeck: [],
  nDiscard: [],
  selectedEnchant: { type: 'fusion', value: 6 },
  isRemoving: false,
  setGameState: vi.fn(),
  setNpcActionText: vi.fn(),
  setNpcHand: vi.fn(),
  setBattleMessage: vi.fn(),
  setHp: vi.fn(),
  setPDiscard: vi.fn(),
  setNDiscard: vi.fn(),
  setHand: vi.fn(),
  setCoins: vi.fn(),
  setEnchantOptions: vi.fn(),
  setShopOffers: vi.fn(),
  setSelectedEnchant: vi.fn(),
  setPDeck: vi.fn(),
  setIsRemoving: vi.fn(),
  setStage: vi.fn(),
  startStage: vi.fn(),
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useProgressionFlow', () => {
  it('moves a normal win into enchant flow after resolve timeout', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const playerHand = [makeCard({ id: 'p1', rank: '10', values: [10] }), makeCard({ id: 'p2', rank: '9', values: [9] })];
    const npcHand = [makeCard({ id: 'n1', rank: '8', values: [8], owner: 'NPC', hidden: true }), makeCard({ id: 'n2', rank: '9', values: [9], owner: 'NPC' })];
    const props = createProps();

    const { result } = renderHook(() => useProgressionFlow(props));

    act(() => {
      result.current.executeResolve(playerHand, npcHand, false);
    });

    expect(props.setGameState).toHaveBeenCalledWith('RESOLVE');
    expect(props.setNpcActionText).toHaveBeenCalledWith('');
    expect(props.setNpcHand).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ hidden: false })]));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(props.setHp).toHaveBeenCalledWith(5);
    expect(props.setHand).toHaveBeenCalledWith([]);
    expect(props.setNpcHand).toHaveBeenLastCalledWith([]);
    expect(props.setEnchantOptions).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'fusion', value: 6 }),
      expect.objectContaining({ type: 'scissor' }),
    ]);
    expect(props.setGameState).toHaveBeenLastCalledWith('ENCHANT');
  });

  it('delays instant win handoff into resolve logic', () => {
    vi.useFakeTimers();

    const playerHand = [makeCard({ id: 'p1', rank: 'A', values: [1, 11] }), makeCard({ id: 'p2', rank: 'K', values: [10] })];
    const npcHand = [makeCard({ id: 'n1', rank: '8', values: [8], owner: 'NPC' })];
    const props = createProps();

    const { result } = renderHook(() => useProgressionFlow(props));

    act(() => {
      result.current.triggerInstantWin(playerHand, npcHand);
    });

    expect(props.setGameState).toHaveBeenCalledWith('RESOLVE');
    expect(props.setBattleMessage).toHaveBeenCalledWith(expect.objectContaining({ text: '完美 21 点！直接胜利！' }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(props.setNpcHand).toHaveBeenCalledWith(expect.any(Array));
  });
});