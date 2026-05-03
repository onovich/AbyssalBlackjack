import { useCallback, useEffect } from 'react';
import { decideNpcAction, drawSingleCard, resolveAfterJokerState, resolveJokerRollState, resolveNpcDrawState } from '../domain/engine';

export function useBattleFlow({
  gameState,
  turn,
  rollingJoker,
  jokerDiceCount,
  hand,
  npcHand,
  npcStand,
  playerStand,
  nDeck,
  nDiscard,
  setHand,
  setRollingJoker,
  setJokerDiceCount,
  setBattleMessage,
  setTurn,
  setNpcActionText,
  setNDeck,
  setNDiscard,
  setNpcHand,
  setNpcStand,
  executeResolve,
  triggerInstantWin,
}) {
  const resolveAfterJoker = useCallback((currentHand) => {
    const jokerState = resolveAfterJokerState({ currentHand, source: rollingJoker.source, npcStand });

    setRollingJoker(jokerState.nextRollingJoker);
    setJokerDiceCount(jokerState.nextJokerDiceCount);

    if (jokerState.nextRollingJoker) {
      return;
    }

    if (jokerState.handData.isBust) executeResolve(currentHand, npcHand, true);
    else if (jokerState.handData.score === 21) triggerInstantWin(currentHand, npcHand);
    else if (jokerState.shouldPassTurnToNpc) setTurn('NPC');
  }, [executeResolve, npcHand, npcStand, rollingJoker, setJokerDiceCount, setRollingJoker, setTurn, triggerInstantWin]);

  const handleRollJoker = useCallback(() => {
    const jokerRollState = resolveJokerRollState({ rollingJoker, hand, jokerDiceCount });

    setHand(jokerRollState.nextHand);
    setRollingJoker(jokerRollState.updatedJoker);
    setJokerDiceCount(jokerRollState.nextJokerDiceCount);

    if (jokerRollState.busted) {
      setHand(jokerRollState.bustedHand);
      setBattleMessage({ text: '点数溢出！小丑牌销毁！', type: 'text-red-500 drop-shadow-[0_0_15px_red] text-2xl font-black' });

      setTimeout(() => {
        setHand(jokerRollState.cleanedHand);
        setBattleMessage({ text: '', type: '' });
        resolveAfterJoker(jokerRollState.cleanedHand);
      }, 1200);
    } else if (jokerRollState.handData.score === 21) {
      resolveAfterJoker(jokerRollState.nextHand);
    }
  }, [hand, jokerDiceCount, resolveAfterJoker, rollingJoker, setBattleMessage, setHand, setJokerDiceCount, setRollingJoker]);

  const handleStopJoker = useCallback(() => {
    resolveAfterJoker(hand);
  }, [hand, resolveAfterJoker]);

  useEffect(() => {
    if (gameState === 'BATTLE' && turn === 'NPC' && !rollingJoker) {
      setNpcActionText('深渊恶魔思考中...');

      const aiTimer = setTimeout(() => {
        const npcDecision = decideNpcAction({ npcHand, playerHand: hand, playerStand });

        if (npcDecision.shouldHit) {
          setNpcActionText('恶魔决定抽牌！');
          setTimeout(() => {
            const { drawn, deck: newDeck, discard: newDiscard } = drawSingleCard(nDeck, nDiscard);
            setNDeck(newDeck);
            setNDiscard(newDiscard);

            if (drawn) {
              const npcDrawState = resolveNpcDrawState({ npcHand, drawn });
              setNpcHand(npcDrawState.npcHand);
              setTimeout(() => setNpcHand((currentHand) => currentHand.filter((card) => !card.isSliced)), 600);

              if (npcDrawState.npcData.isBust) executeResolve(hand, npcDrawState.npcHand, false);
              else {
                setNpcActionText('');
                if (!playerStand) setTurn('PLAYER');
              }
            } else {
              setNpcActionText('无牌可抽，被迫停牌');
              setNpcStand(true);
              setTimeout(() => {
                if (playerStand) executeResolve(hand, npcHand, false);
                else setTurn('PLAYER');
              }, 1000);
            }
          }, 800);
        } else {
          setNpcActionText('恶魔选择停牌 (Stand)');
          setNpcStand(true);
          setTimeout(() => {
            if (playerStand) executeResolve(hand, npcHand, false);
            else setTurn('PLAYER');
          }, 1000);
        }
      }, 1200);

      return () => clearTimeout(aiTimer);
    }
  }, [executeResolve, gameState, hand, nDeck, nDiscard, npcHand, playerStand, rollingJoker, setNDeck, setNDiscard, setNpcActionText, setNpcHand, setNpcStand, setTurn, turn]);

  return {
    handleRollJoker,
    handleStopJoker,
  };
}