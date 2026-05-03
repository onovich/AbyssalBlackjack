import { useEffect, useReducer } from 'react';
import {
  acceptJoker,
  applyEnchant,
  beginRun,
  buyCard,
  cleanupSlicedCards,
  createInitialState,
  executeRedraw,
  executeStuff,
  finishResolve,
  goToNextStage,
  heal,
  hit,
  npcTakeTurn,
  removeCard,
  rollJoker,
  selectEnchant,
  skipEnchant,
  stand,
  toggleStuffMode,
  toggleRedrawMode,
  toggleRemoveMode,
} from '../domain/engine';

function reducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return beginRun(state);
    case 'HIT':
      return state.gameState === 'BATTLE' && !state.rollingJoker ? hit(state) : state;
    case 'STAND':
      return state.gameState === 'BATTLE' && !state.rollingJoker ? stand(state) : state;
    case 'FINISH_RESOLVE':
      return state.gameState === 'RESOLVE' ? finishResolve(state) : state;
    case 'NPC_TAKE_TURN':
      return state.gameState === 'BATTLE' && state.turn === 'NPC' ? npcTakeTurn(state) : state;
    case 'CLEANUP_SLICED':
      return cleanupSlicedCards(state);
    case 'ROLL_JOKER':
      return state.gameState === 'BATTLE' && state.rollingJoker ? rollJoker(state) : state;
    case 'ACCEPT_JOKER':
      return state.gameState === 'BATTLE' && state.rollingJoker ? acceptJoker(state) : state;
    case 'TOGGLE_REDRAW_MODE':
      return toggleRedrawMode(state);
    case 'EXECUTE_REDRAW':
      return executeRedraw(state, action.cardId);
    case 'TOGGLE_STUFF_MODE':
      return toggleStuffMode(state);
    case 'EXECUTE_STUFF':
      return executeStuff(state, action.cardId);
    case 'SELECT_ENCHANT':
      return selectEnchant(state, action.enchantmentId);
    case 'APPLY_ENCHANT':
      return applyEnchant(state, action.cardId, action.location);
    case 'SKIP_ENCHANT':
      return skipEnchant(state);
    case 'BUY_CARD':
      return state.gameState === 'SHOP' ? buyCard(state, action.offerIndex) : state;
    case 'HEAL':
      return state.gameState === 'SHOP' ? heal(state) : state;
    case 'TOGGLE_REMOVE_MODE':
      return state.gameState === 'SHOP' ? toggleRemoveMode(state) : state;
    case 'REMOVE_CARD':
      return state.gameState === 'SHOP'
        ? removeCard(state, action.cardId, action.location)
        : state;
    case 'NEXT_STAGE':
      return state.gameState === 'SHOP' ? goToNextStage(state) : state;
    default:
      return state;
  }
}

export function useAbyssalBlackjack() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState());

  useEffect(() => {
    if (state.gameState !== 'RESOLVE') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: 'FINISH_RESOLVE' });
    }, state.resolveDelayMs);

    return () => window.clearTimeout(timer);
  }, [state.gameState, state.resolveDelayMs]);

  useEffect(() => {
    if (state.gameState !== 'BATTLE' || state.turn !== 'NPC' || state.rollingJoker) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: 'NPC_TAKE_TURN' });
    }, state.npcTurnDelayMs);

    return () => window.clearTimeout(timer);
  }, [state.gameState, state.turn, state.rollingJoker, state.npcTurnDelayMs, state.npcHand]);

  useEffect(() => {
    if (!state.pendingSliceCleanup) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: 'CLEANUP_SLICED' });
    }, state.sliceDelayMs);

    return () => window.clearTimeout(timer);
  }, [state.pendingSliceCleanup, state.sliceDelayMs]);

  return {
    state,
    actions: {
      startGame: () => dispatch({ type: 'START_GAME' }),
      hit: () => dispatch({ type: 'HIT' }),
      stand: () => dispatch({ type: 'STAND' }),
      rollJoker: () => dispatch({ type: 'ROLL_JOKER' }),
      acceptJoker: () => dispatch({ type: 'ACCEPT_JOKER' }),
      toggleRedrawMode: () => dispatch({ type: 'TOGGLE_REDRAW_MODE' }),
      executeRedraw: (cardId) => dispatch({ type: 'EXECUTE_REDRAW', cardId }),
      toggleStuffMode: () => dispatch({ type: 'TOGGLE_STUFF_MODE' }),
      executeStuff: (cardId) => dispatch({ type: 'EXECUTE_STUFF', cardId }),
      selectEnchant: (enchantmentId) => dispatch({ type: 'SELECT_ENCHANT', enchantmentId }),
      applyEnchant: (cardId, location) => dispatch({ type: 'APPLY_ENCHANT', cardId, location }),
      skipEnchant: () => dispatch({ type: 'SKIP_ENCHANT' }),
      buyCard: (offerIndex) => dispatch({ type: 'BUY_CARD', offerIndex }),
      heal: () => dispatch({ type: 'HEAL' }),
      toggleRemoveMode: () => dispatch({ type: 'TOGGLE_REMOVE_MODE' }),
      removeCard: (cardId, location) => dispatch({ type: 'REMOVE_CARD', cardId, location }),
      nextStage: () => dispatch({ type: 'NEXT_STAGE' }),
    },
  };
}