// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBattleFlow } from './useBattleFlow';

const makeCard = ({
  id = 'card',
  suit = '♥',
  color = 'text-red-600',
  rank = '2',
  values = [2],
  isJoker = false,
  hidden = false,
  isSliced = false,
  isScissor = false,
  owner = 'PLAYER',
} = {}) => ({
  id,
  suit,
  color,
  rank,
  baseRank: isJoker ? 'JOKER' : rank,
  baseValues: isJoker ? [0] : values,
  values,
  isScissor,
  isJoker,
  hidden,
  isSliced,
  owner,
});

const createProps = (overrides = {}) => ({
  gameState: 'BATTLE',
  turn: 'PLAYER',
  rollingJoker: null,
  jokerDiceCount: 1,
  hand: [],
  npcHand: [],
  npcStand: false,
  playerStand: false,
  nDeck: [],
  nDiscard: [],
  setHand: vi.fn(),
  setRollingJoker: vi.fn(),
  setJokerDiceCount: vi.fn(),
  setBattleMessage: vi.fn(),
  setTurn: vi.fn(),
  setNpcActionText: vi.fn(),
  setNDeck: vi.fn(),
  setNDiscard: vi.fn(),
  setNpcHand: vi.fn(),
  setNpcStand: vi.fn(),
  executeResolve: vi.fn(),
  triggerInstantWin: vi.fn(),
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useBattleFlow', () => {
  it('cleans up busted joker flow and hands turn back to npc after timeout', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const joker = makeCard({ id: 'joker', rank: 'JOKER', values: [18], isJoker: true });
    const props = createProps({
      rollingJoker: { ...joker, source: 'HIT' },
      jokerDiceCount: 1,
      hand: [joker],
    });

    const { result } = renderHook(() => useBattleFlow(props));

    act(() => {
      result.current.handleRollJoker();
    });

    expect(props.setRollingJoker).toHaveBeenCalledWith(expect.objectContaining({ rank: '🃏24' }));
    expect(props.setJokerDiceCount).toHaveBeenCalledWith(2);
    expect(props.setBattleMessage).toHaveBeenCalledWith(expect.objectContaining({ text: '点数溢出！小丑牌销毁！' }));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(props.setBattleMessage).toHaveBeenLastCalledWith({ text: '', type: '' });
    expect(props.setRollingJoker).toHaveBeenLastCalledWith(null);
    expect(props.setJokerDiceCount).toHaveBeenLastCalledWith(1);
    expect(props.setTurn).toHaveBeenCalledWith('NPC');
  });

  it('forces npc to stand and resolve when deck is empty and player already stood', () => {
    vi.useFakeTimers();

    const props = createProps({
      turn: 'NPC',
      playerStand: true,
      npcHand: [makeCard({ id: 'n1', rank: '9', values: [9], owner: 'NPC' })],
      hand: [makeCard({ id: 'p1', rank: '10', values: [10] })],
    });

    renderHook(() => useBattleFlow(props));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(props.setNpcActionText).toHaveBeenCalledWith('深渊恶魔思考中...');
    expect(props.setNpcActionText).toHaveBeenCalledWith('恶魔决定抽牌！');

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(props.setNpcActionText).toHaveBeenCalledWith('无牌可抽，被迫停牌');
    expect(props.setNpcStand).toHaveBeenCalledWith(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(props.executeResolve).toHaveBeenCalledWith(props.hand, props.npcHand, false);
  });
});