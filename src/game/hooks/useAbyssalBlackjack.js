import { useEffect, useReducer } from 'react';
import {
  acceptJoker,
  applyEnchant,
  beginRun,
  buyCard,
  createInitialState,
  finishResolve,
  goToNextStage,
  heal,
  hit,
  removeCard,
  rollJoker,
  selectEnchant,
  skipEnchant,
  stand,
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
    case 'ROLL_JOKER':
      return state.gameState === 'BATTLE' && state.rollingJoker ? rollJoker(state) : state;
    case 'ACCEPT_JOKER':
      return state.gameState === 'BATTLE' && state.rollingJoker ? acceptJoker(state) : state;
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

  return {
    state,
    actions: {
      startGame: () => dispatch({ type: 'START_GAME' }),
      hit: () => dispatch({ type: 'HIT' }),
      stand: () => dispatch({ type: 'STAND' }),
      rollJoker: () => dispatch({ type: 'ROLL_JOKER' }),
      acceptJoker: () => dispatch({ type: 'ACCEPT_JOKER' }),
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