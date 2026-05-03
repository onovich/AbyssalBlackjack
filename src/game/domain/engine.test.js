import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  decideNpcAction,
  getPostResolveState,
  resolveBattleState,
  resolveHitState,
  resolveJokerRollState,
  resolveRedrawState,
} from './engine';

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('engine.resolveBattleState', () => {
  it('prioritizes player bust as a loss', () => {
    const result = resolveBattleState({
      finalPlayerHand: [makeCard({ id: 'p1', rank: 'K', values: [10] }), makeCard({ id: 'p2', rank: 'Q', values: [10] }), makeCard({ id: 'p3', rank: '5', values: [5] })],
      finalNpcHand: [makeCard({ id: 'n1', rank: '9', values: [9], owner: 'NPC', hidden: true }), makeCard({ id: 'n2', rank: '8', values: [8], owner: 'NPC' })],
      playerBusted: true,
    });

    expect(result.result).toBe('LOSS');
    expect(result.revealedNpc.every((card) => card.hidden === false)).toBe(true);
    expect(result.battleMessage.text).toContain('爆牌了');
  });

  it('returns draw when both visible scores are equal', () => {
    const result = resolveBattleState({
      finalPlayerHand: [makeCard({ id: 'p1', rank: '10', values: [10] }), makeCard({ id: 'p2', rank: '8', values: [8] })],
      finalNpcHand: [makeCard({ id: 'n1', rank: '9', values: [9], owner: 'NPC' }), makeCard({ id: 'n2', rank: '9', values: [9], owner: 'NPC', hidden: true })],
      playerBusted: false,
    });

    expect(result.result).toBe('DRAW');
    expect(result.battleMessage.text).toContain('平局');
  });
});

describe('engine.getPostResolveState', () => {
  it('produces OVER when player loses last hp and cleans resolved cards', () => {
    const playerJoker = makeCard({ id: 'pj', rank: '🃏6', values: [6], isJoker: true, owner: 'PLAYER' });
    const npcCard = makeCard({ id: 'n1', rank: '9', values: [9], owner: 'NPC', hidden: true, isSliced: true });

    const result = getPostResolveState({
      hp: 1,
      stage: 2,
      result: 'LOSS',
      finalPlayerHand: [playerJoker],
      revealedNpc: [npcCard],
    });

    expect(result.finalHp).toBe(0);
    expect(result.nextGameState).toBe('OVER');
    expect(result.coinDelta).toBe(1);
    expect(result.playerDiscard[0]).toMatchObject({ rank: 'JOKER', values: [0], hidden: false, isSliced: false });
    expect(result.npcDiscard[0]).toMatchObject({ hidden: false, isSliced: false });
  });

  it('produces ENCHANT on normal win and WIN on final-stage win', () => {
    const enchantResult = getPostResolveState({
      hp: 5,
      stage: 3,
      result: 'WIN',
      finalPlayerHand: [],
      revealedNpc: [],
    });
    const finalStageResult = getPostResolveState({
      hp: 5,
      stage: 8,
      result: 'WIN',
      finalPlayerHand: [],
      revealedNpc: [],
    });

    expect(enchantResult.nextGameState).toBe('ENCHANT');
    expect(enchantResult.coinDelta).toBe(6);
    expect(finalStageResult.nextGameState).toBe('WIN');
  });
});

describe('engine.player and npc actions', () => {
  it('marks the previous card sliced when a scissor card is hit', () => {
    const baseHand = [makeCard({ id: 'a', rank: '8', values: [8] })];
    const scissor = makeCard({ id: 's', rank: '4', values: [4], isScissor: true });

    const result = resolveHitState({ hand: baseHand, drawn: scissor });

    expect(result.hand[0].isSliced).toBe(true);
    expect(result.hand[1].id).toBe('s');
  });

  it('supports redraw with no replacement draw', () => {
    const result = resolveRedrawState({
      hand: [makeCard({ id: 'a', rank: '10', values: [10] }), makeCard({ id: 'b', rank: '7', values: [7] })],
      cardId: 'a',
      drawn: null,
    });

    expect(result.hand).toHaveLength(1);
    expect(result.hand[0].id).toBe('b');
    expect(result.drewJoker).toBe(false);
  });

  it('makes npc hit under 17 and otherwise compare against the player', () => {
    const lowScore = decideNpcAction({
      npcHand: [makeCard({ id: 'n1', rank: '8', values: [8], owner: 'NPC' })],
      playerHand: [makeCard({ id: 'p1', rank: '10', values: [10] })],
      playerStand: false,
    });
    const losingScore = decideNpcAction({
      npcHand: [makeCard({ id: 'n2', rank: '9', values: [9], owner: 'NPC' }), makeCard({ id: 'n3', rank: '9', values: [9], owner: 'NPC' })],
      playerHand: [makeCard({ id: 'p2', rank: '10', values: [10] }), makeCard({ id: 'p3', rank: '9', values: [9] })],
      playerStand: false,
    });

    expect(lowScore.shouldHit).toBe(true);
    expect(losingScore.shouldHit).toBe(true);
  });
});

describe('engine.resolveJokerRollState', () => {
  it('increments dice count and handles bust cleanup state', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const joker = makeCard({ id: 'j1', rank: 'JOKER', values: [18], isJoker: true });
    const result = resolveJokerRollState({
      rollingJoker: joker,
      hand: [joker],
      jokerDiceCount: 1,
    });

    expect(result.updatedJoker.rank).toBe('🃏24');
    expect(result.nextJokerDiceCount).toBe(2);
    expect(result.busted).toBe(true);
    expect(result.bustedHand[0].isSliced).toBe(true);
    expect(result.cleanedHand).toEqual([]);
  });
});