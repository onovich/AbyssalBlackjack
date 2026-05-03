import { useEffect, useReducer } from 'react';
import {
  beginRun,
  buyCard,
  createInitialState,
  finishResolve,
  goToNextStage,
  heal,
  hit,
  removeCard,
  stand,
  toggleRemoveMode,
} from '../domain/engine';

function reducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return beginRun(state);
    case 'HIT':
      return state.gameState === 'BATTLE' ? hit(state) : state;
    case 'STAND':
      return state.gameState === 'BATTLE' ? stand(state) : state;
    case 'FINISH_RESOLVE':
      return state.gameState === 'RESOLVE' ? finishResolve(state) : state;
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
      buyCard: (offerIndex) => dispatch({ type: 'BUY_CARD', offerIndex }),
      heal: () => dispatch({ type: 'HEAL' }),
      toggleRemoveMode: () => dispatch({ type: 'TOGGLE_REMOVE_MODE' }),
      removeCard: (cardId, location) => dispatch({ type: 'REMOVE_CARD', cardId, location }),
      nextStage: () => dispatch({ type: 'NEXT_STAGE' }),
    },
  };
}