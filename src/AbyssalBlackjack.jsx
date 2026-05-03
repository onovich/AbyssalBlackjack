import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Coins, ShieldAlert, ShoppingCart, ArrowRight, Play, RefreshCw, Trash2, PlusCircle, Scissors, Zap, Sparkles, User, Sword, Dices } from 'lucide-react';

// --- 常量与工具函数 ---
const SUITS = [
  { suit: '♠', color: 'text-slate-800' },
  { suit: '♥', color: 'text-red-600' },
  { suit: '♣', color: 'text-slate-800' },
  { suit: '♦', color: 'text-red-600' }
];
const MAX_HP = 5;
const MAX_STAGES = 8;

const generateId = () => Math.random().toString(36).substr(2, 9);

// 增加 owner 属性区分归属
const createCard = (suitObj, rank, valuesOverride = null, isScissor = false, isJoker = false, owner = 'PLAYER') => {
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
    rank: rank,
    baseRank: rank,
    baseValues: baseVals,
    values: baseVals,
    isScissor: isScissor,
    isJoker: isJoker || rank === 'JOKER',
    hidden: false,
    isSliced: false,
    owner: owner
  };
};

const generateInitialDeck = (owner) => {
  let deck = [];
  ['♠', '♥'].forEach(s => {
    const suitObj = SUITS.find(su => su.suit === s);
    ['A', '2', '3', '4', '5', '6', '7'].forEach(rank => {
      deck.push(createCard(suitObj, rank, null, false, false, owner));
    });
  });
  deck.push(createCard({ suit: '🃏', color: 'text-purple-500' }, 'JOKER', [0], false, true, owner));
  return shuffle(deck);
};

const generateShopCards = () => {
  let cards = [];
  const pool = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'JOKER'];
  for (let i = 0; i < 3; i++) {
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

const generateNpcScalingCard = () => {
  const pool = ['8', '9', '10', 'J', 'Q', 'K', 'A', 'JOKER'];
  const rank = pool[Math.floor(Math.random() * pool.length)];
  if (rank === 'JOKER') {
     return createCard({ suit: '🃏', color: 'text-purple-500' }, 'JOKER', [0], false, true, 'NPC');
  }
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return createCard(suit, rank, null, false, false, 'NPC');
};

const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

// --- 核心算分逻辑 ---
const calculateScoreData = (hand, calculateAll = false) => {
  const activeHand = hand.filter(c => !c.isSliced && (calculateAll ? true : !c.hidden));
  if (activeHand.length === 0) return { score: 0, isFlush: false, isBust: false };
  
  let isFlush = false;
  if (activeHand.length >= 2) {
    const firstSuit = activeHand[0].suit;
    isFlush = activeHand.every(c => c.suit === firstSuit);
  }

  let sums = [0];
  activeHand.forEach(card => {
    let newSums = [];
    sums.forEach(s => {
      card.values.forEach(v => {
        newSums.push(s + v);
      });
    });
    sums = Array.from(new Set(newSums));
  });

  let finalSums = [...sums];
  if (isFlush) {
    sums.forEach(s => {
      finalSums.push(s + 1);
      finalSums.push(s - 1);
    });
    finalSums = Array.from(new Set(finalSums));
  }

  const valid = finalSums.filter(s => s <= 21);
  const isBust = valid.length === 0;
  const score = isBust ? Math.min(...finalSums) : Math.max(...valid);

  return { score, isFlush, isBust };
};

// --- UI组件 ---
const Card = ({ card, className = "", isSelectable = false, onClick }) => {
  if (!card) return null;
  if (card.hidden) {
    return (
      <div className={`w-24 h-36 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-xl shadow-lg border-2 border-indigo-500/50 flex items-center justify-center relative transition-all duration-300 ${card.isSliced ? 'opacity-0 scale-50 rotate-[-20deg] translate-y-10 blur-sm pointer-events-none' : ''} ${className}`}>
        <div className="absolute inset-2 border border-indigo-400/20 rounded bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(99,102,241,0.1)_5px,rgba(99,102,241,0.1)_10px)]"></div>
        <div className="text-indigo-400/30"><ShieldAlert size={32} /></div>
        {card.isSliced && <div className="absolute inset-0 flex items-center justify-center z-10"><div className="w-[150%] h-1.5 bg-red-500 rotate-45 shadow-[0_0_15px_red]"></div></div>}
      </div>
    );
  }

  const rankTextSize = card.rank.length > 2 ? 'text-sm' : 'text-lg';

  return (
    <div onClick={onClick} className={`w-24 h-36 bg-slate-50 rounded-xl shadow-xl border-2 border-slate-300 flex flex-col justify-between p-2 select-none relative overflow-hidden transition-all duration-500 ease-out origin-center ${isSelectable ? 'cursor-pointer hover:ring-4 hover:-translate-y-2' : ''} ${card.isSliced ? 'opacity-0 scale-50 rotate-[-20deg] translate-y-10 blur-sm pointer-events-none' : ''} ${className}`}>
      <span className={`font-black leading-none ${rankTextSize} ${card.color}`}>{card.rank}</span>
      <span className={`text-4xl self-center drop-shadow-sm ${card.color}`}>{card.suit}</span>
      <span className={`font-black leading-none self-end rotate-180 ${rankTextSize} ${card.color}`}>{card.rank}</span>
      
      {card.isScissor && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 opacity-20 pointer-events-none"><Scissors size={48} /></div>}
      {card.isScissor && <div className="absolute bottom-1 right-1 text-red-600 bg-white rounded-full p-0.5 shadow-sm border border-red-200"><Scissors size={14} /></div>}
      {card.isJoker && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-500 opacity-20 pointer-events-none"><Dices size={48} /></div>}

      {card.isSliced && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
           <div className="w-[150%] h-1.5 bg-red-500 rotate-45 shadow-[0_0_15px_red]"></div>
        </div>
      )}
    </div>
  );
};

export default function AbyssalBlackjack() {
  const [gameState, setGameState] = useState('START'); 
  const [turn, setTurn] = useState('PLAYER'); 
  
  const [pDeck, setPDeck] = useState([]);
  const [pDiscard, setPDiscard] = useState([]);
  const [nDeck, setNDeck] = useState([]);
  const [nDiscard, setNDiscard] = useState([]);
  
  const [hand, setHand] = useState([]);
  const [npcHand, setNpcHand] = useState([]);
  
  const [playerStand, setPlayerStand] = useState(false);
  const [npcStand, setNpcStand] = useState(false);

  const [hp, setHp] = useState(MAX_HP);
  const [coins, setCoins] = useState(0);
  const [stage, setStage] = useState(1);
  
  // 技能充能状态
  const [skillCharges, setSkillCharges] = useState(0);
  const [redrawCharges, setRedrawCharges] = useState(0);
  
  // 技能选择状态
  const [isSelectingStuff, setIsSelectingStuff] = useState(false);
  const [isSelectingRedraw, setIsSelectingRedraw] = useState(false);

  // 小丑牌状态
  const [rollingJoker, setRollingJoker] = useState(null);
  const [jokerDiceCount, setJokerDiceCount] = useState(1); // 控制骰子数量增加

  const [battleMessage, setBattleMessage] = useState({ text: '', type: '' });
  const [npcActionText, setNpcActionText] = useState('');
  
  const [shopOffers, setShopOffers] = useState([]);
  const [enchantOptions, setEnchantOptions] = useState([]);
  const [selectedEnchant, setSelectedEnchant] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // --- 基础发牌与状态管理 ---

  const drawSingleCard = (currentDeck, currentDiscard) => {
    let d = [...currentDeck]; let disc = [...currentDiscard];
    if (d.length === 0) { d = shuffle(disc); disc = []; }
    if (d.length === 0) return { drawn: null, deck: d, discard: disc };
    return { drawn: d.pop(), deck: d, discard: disc };
  };

  const startStage = useCallback((tempPDeck = pDeck, tempPDiscard = pDiscard, tempNDeck = nDeck, tempNDiscard = nDiscard) => {
    let pD = [...tempPDeck]; let pDisc = [...tempPDiscard];
    const drawForP = () => { const res = drawSingleCard(pD, pDisc); pD = res.deck; pDisc = res.discard; return res.drawn; };
    
    let nD = [...tempNDeck]; let nDisc = [...tempNDiscard];
    const drawForN = () => { const res = drawSingleCard(nD, nDisc); nD = res.deck; nDisc = res.discard; return res.drawn; };

    const c1 = drawForP(); const c2 = drawForP();
    const n1 = drawForN(); const n2 = drawForN();

    let newPHand = [];
    if (c1) newPHand.push(c1);
    if (c2) {
      if (c2.isScissor && newPHand.length > 0) newPHand[newPHand.length - 1].isSliced = true;
      newPHand.push(c2);
    }
    setTimeout(() => setHand(curr => curr.filter(c => !c.isSliced)), 600);

    let newNHand = [];
    const autoRollNpcJoker = (card) => {
       if(card && card.isJoker) {
         const roll = Math.floor(Math.random() * 6) + 1;
         card.values = [roll]; card.rank = `🃏${roll}`;
       }
    };
    autoRollNpcJoker(n1); autoRollNpcJoker(n2);

    if (n1) newNHand.push(n1);
    if (n2) {
      if (n2.isScissor && newNHand.length > 0) newNHand[newNHand.length - 1].isSliced = true;
      newNHand.push({ ...n2, hidden: true }); 
    }
    setTimeout(() => setNpcHand(curr => curr.filter(c => !c.isSliced)), 600);

    setPDeck(pD); setPDiscard(pDisc);
    setNDeck(nD); setNDiscard(nDisc);
    
    setHand(newPHand); setNpcHand(newNHand);
    setPlayerStand(false); setNpcStand(false);
    setTurn('PLAYER'); setGameState('BATTLE');
    setBattleMessage({ text: '', type: '' }); setNpcActionText('');
    setIsSelectingStuff(false); setIsSelectingRedraw(false); 
    setRollingJoker(null); setJokerDiceCount(1);

    const initialJoker = newPHand.find(c => c.isJoker && c.values[0] === 0 && !c.isSliced);
    if (initialJoker) {
        setRollingJoker({ ...initialJoker, source: 'START' });
    } else {
        const initialPData = calculateScoreData(newPHand, true);
        if (initialPData.score === 21) triggerInstantWin(newPHand, newNHand);
    }
  }, [pDeck, pDiscard, nDeck, nDiscard]);

  const startGame = () => {
    const initPDeck = generateInitialDeck('PLAYER');
    const initNDeck = generateInitialDeck('NPC');
    setHp(MAX_HP); setCoins(0); setStage(1); 
    setSkillCharges(0); setRedrawCharges(0);
    startStage(initPDeck, [], initNDeck, []);
  };

  const triggerInstantWin = (pHand, nHand) => {
    setGameState('RESOLVE');
    setBattleMessage({ text: '完美 21 点！直接胜利！', type: 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,1)] text-4xl font-black scale-110 animate-pulse' });
    setTimeout(() => { executeResolve(pHand, nHand, false, true); }, 2000);
  };

  const executeResolve = (finalPlayerHand, finalNpcHand, playerBusted, instantWin = false) => {
    setGameState('RESOLVE'); setNpcActionText('');
    
    const revealedNpc = finalNpcHand.map(c => ({...c, hidden: false}));
    setNpcHand(revealedNpc);

    const pData = calculateScoreData(finalPlayerHand, true);
    const nData = calculateScoreData(revealedNpc, true);

    let result = '';
    if (instantWin) result = 'WIN';
    else if (playerBusted || pData.isBust) result = 'LOSS';
    else if (nData.isBust) result = 'WIN';
    else if (pData.score > nData.score) result = 'WIN';
    else if (pData.score < nData.score) result = 'LOSS';
    else result = 'DRAW';

    if (!instantWin) {
      let msg = '', msgType = '';
      if (result === 'WIN') { msg = `胜利！ ${pData.score} 击溃了 ${nData.score}`; msgType = 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]'; } 
      else if (result === 'LOSS') { msg = playerBusted ? `爆牌了！ (${pData.score})` : `败北！ ${pData.score} 不敌 ${nData.score}`; msgType = 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'; } 
      else { msg = `势均力敌的平局 (${pData.score})`; msgType = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'; }
      setBattleMessage({ text: msg, type: msgType });
    }

    setTimeout(() => {
      const finalHp = hp - (result === 'LOSS' ? 1 : 0);
      setHp(finalHp);
      
      if (finalHp <= 0) setGameState('OVER');
      else if (stage >= MAX_STAGES && result === 'WIN') setGameState('WIN');
      else {
        const cleanCard = (c) => ({ ...c, isSliced: false, values: c.isJoker ? [0] : c.values, rank: c.isJoker ? 'JOKER' : c.rank, hidden: false });
        const allPlayedCards = [...finalPlayerHand, ...revealedNpc].map(cleanCard);
        
        const playerOwnedCards = allPlayedCards.filter(c => c.owner === 'PLAYER');
        const npcOwnedCards = allPlayedCards.filter(c => c.owner === 'NPC');

        setPDiscard(prev => [...prev, ...playerOwnedCards]);
        setNDiscard(prev => [...prev, ...npcOwnedCards]);
        
        setHand([]); setNpcHand([]);
        
        if (result === 'WIN') {
          setCoins(c => c + 6);
          const fVal = Math.floor(Math.random() * 8) + 2; 
          setEnchantOptions([
            { type: 'fusion', value: fVal, title: `融合: 附加 [${fVal}] 点`, desc: '赋予卡牌双重点数能力', icon: <Sparkles className="text-blue-400"/> },
            { type: 'scissor', title: '附魔: 剪刀手', desc: '打出或塞给敌方时，斩碎前一张牌', icon: <Scissors className="text-red-400"/> }
          ]);
          setGameState('ENCHANT');
        } else {
          setCoins(c => c + (result === 'DRAW' ? 2 : 1));
          setShopOffers(generateShopCards());
          setGameState('SHOP');
        }
      }
    }, 3000);
  };

  // --- 玩家动作逻辑 ---

  const handleHit = () => {
    if (isSelectingStuff) setIsSelectingStuff(false);
    if (isSelectingRedraw) setIsSelectingRedraw(false);
    
    const { drawn, deck: newDeck, discard: newDiscard } = drawSingleCard(pDeck, pDiscard);
    setPDeck(newDeck); setPDiscard(newDiscard);
    if (!drawn) return;

    let newHand = [...hand];
    if (drawn.isScissor && newHand.length > 0) {
       newHand[newHand.length - 1].isSliced = true;
    }
    newHand.push(drawn);
    setHand(newHand);
    
    // 增加技能充能
    setSkillCharges(prev => Math.min(5, prev + 1));
    setRedrawCharges(prev => Math.min(5, prev + 1));

    setTimeout(() => setHand(curr => curr.filter(c => !c.isSliced)), 600);

    if (drawn.isJoker) {
       setRollingJoker({ ...drawn, source: 'HIT' });
       return; 
    }

    const pData = calculateScoreData(newHand, true);
    if (pData.isBust) executeResolve(newHand, npcHand, true);
    else if (pData.score === 21) triggerInstantWin(newHand, npcHand);
    else if (!npcStand) setTurn('NPC');
  };

  const handleStand = () => {
    if (isSelectingStuff) setIsSelectingStuff(false);
    if (isSelectingRedraw) setIsSelectingRedraw(false);
    setPlayerStand(true);
    if (npcStand) executeResolve(hand, npcHand, false);
    else setTurn('NPC');
  };

  // 塞牌技能
  const handleStuffSkillClick = () => {
    if (skillCharges < 5 || hand.filter(c=>!c.isSliced).length === 0) return;
    if (isSelectingRedraw) setIsSelectingRedraw(false);
    setIsSelectingStuff(!isSelectingStuff);
  };

  // 重抽技能
  const handleRedrawSkillClick = () => {
    if (redrawCharges < 5 || hand.filter(c=>!c.isSliced).length === 0) return;
    if (isSelectingStuff) setIsSelectingStuff(false);
    setIsSelectingRedraw(!isSelectingRedraw);
  };

  // 卡牌点击分发逻辑 (根据选中的技能)
  const handleCardClick = (card) => {
    if (isSelectingStuff) executeStuffCard(card);
    else if (isSelectingRedraw) executeRedrawCard(card);
  };

  const executeStuffCard = (card) => {
    setIsSelectingStuff(false);
    setSkillCharges(prev => prev - 5);

    let newPHand = hand.filter(c => c.id !== card.id);
    setHand(newPHand);

    let currentNpcHand = [...npcHand];
    if (card.isScissor && currentNpcHand.length > 0) {
        currentNpcHand[currentNpcHand.length - 1].isSliced = true;
    }
    currentNpcHand.push({ ...card, hidden: false });
    setNpcHand(currentNpcHand);

    setTimeout(() => setNpcHand(curr => curr.filter(c => !c.isSliced)), 600);

    const nData = calculateScoreData(currentNpcHand, true);
    if (nData.isBust) {
        setGameState('RESOLVE');
        setBattleMessage({ text: '塞牌斩杀！敌方被撑爆了！', type: 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,1)] text-3xl font-black scale-110' });
        setTimeout(() => { executeResolve(newPHand, currentNpcHand, false); }, 2000);
    } else {
        setBattleMessage({ text: '已强行塞入敌方手中！', type: 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)] text-2xl font-black' });
        const pData = calculateScoreData(newPHand, true);
        setTimeout(() => {
             setBattleMessage({ text: '', type: '' });
             if (pData.score === 21) triggerInstantWin(newPHand, currentNpcHand);
             else if (!npcStand) setTurn('NPC');
        }, 1200);
    }
  };

  const executeRedrawCard = (card) => {
    setIsSelectingRedraw(false);
    setRedrawCharges(prev => prev - 5);

    const index = hand.findIndex(c => c.id === card.id);
    if (index === -1) return;

    // 抽出新牌
    const { drawn, deck: newDeck, discard: newDiscard } = drawSingleCard(pDeck, pDiscard);
    setPDeck(newDeck); setPDiscard(newDiscard);
    
    // 将被换掉的牌放入弃牌堆
    setPDiscard(prev => [...prev, card]);

    if (!drawn) {
        // 如果无牌可抽，相当于直接把这牌删了
        let newHand = [...hand];
        newHand.splice(index, 1);
        setHand(newHand);
        const pData = calculateScoreData(newHand, true);
        if (pData.score === 21) triggerInstantWin(newHand, npcHand);
        else if (!npcStand) setTurn('NPC');
        return;
    }

    let newHand = [...hand];
    newHand[index] = drawn; // 在原位置替换

    // 检查是否抽到了剪刀牌并斩杀前牌
    if (drawn.isScissor && index > 0) {
        newHand[index - 1].isSliced = true;
    }
    setHand(newHand);
    setTimeout(() => setHand(curr => curr.filter(c => !c.isSliced)), 600);

    if (drawn.isJoker) {
        setRollingJoker({ ...drawn, source: 'HIT' }); 
        return;
    }

    const pData = calculateScoreData(newHand, true);
    if (pData.isBust) executeResolve(newHand, npcHand, true);
    else if (pData.score === 21) triggerInstantWin(newHand, npcHand);
    else if (!npcStand) setTurn('NPC');
  };

  // --- 小丑牌核心处理 ---

  const resolveAfterJoker = (currentHand) => {
    const nextJoker = currentHand.find(c => c.isJoker && c.values[0] === 0 && !c.isSliced);
    if (nextJoker) {
        setRollingJoker({ ...nextJoker, source: rollingJoker.source });
        setJokerDiceCount(1); // 换下一个小丑时重置骰子数
        return;
    }
    
    setRollingJoker(null);
    setJokerDiceCount(1); // 结束时重置骰子数
    
    const pData = calculateScoreData(currentHand, true);
    if (pData.isBust) executeResolve(currentHand, npcHand, true);
    else if (pData.score === 21) triggerInstantWin(currentHand, npcHand);
    else if (rollingJoker.source === 'HIT' && !npcStand) setTurn('NPC');
  };

  const handleRollJoker = () => {
    let rollSum = 0;
    for(let i = 0; i < jokerDiceCount; i++) {
        rollSum += Math.floor(Math.random() * 6) + 1;
    }
    
    const updatedJoker = { ...rollingJoker };
    updatedJoker.values = [updatedJoker.values[0] + rollSum];
    updatedJoker.rank = `🃏${updatedJoker.values[0]}`;

    const newHand = hand.map(c => c.id === updatedJoker.id ? updatedJoker : c);
    setHand(newHand);
    setRollingJoker(updatedJoker);
    
    // 阶梯式增加风险：下次投掷骰子数量+1
    setJokerDiceCount(prev => prev + 1);

    const pData = calculateScoreData(newHand, true);
    if (pData.isBust) {
        const bustedJoker = { ...updatedJoker, isSliced: true }; 
        const handWithBusted = newHand.map(c => c.id === bustedJoker.id ? bustedJoker : c);
        setHand(handWithBusted);
        setBattleMessage({ text: '点数溢出！小丑牌销毁！', type: 'text-red-500 drop-shadow-[0_0_15px_red] text-2xl font-black' });

        setTimeout(() => {
            const cleanedHand = handWithBusted.filter(c => !c.isSliced);
            setHand(cleanedHand);
            setBattleMessage({ text: '', type: '' });
            resolveAfterJoker(cleanedHand);
        }, 1200);
    } else if (pData.score === 21) {
        resolveAfterJoker(newHand);
    }
  };

  const handleStopJoker = () => { resolveAfterJoker(hand); };

  // --- NPC 智能回合 ---
  useEffect(() => {
    if (gameState === 'BATTLE' && turn === 'NPC' && !rollingJoker) {
      setNpcActionText('深渊恶魔思考中...');
      
      const aiTimer = setTimeout(() => {
        const nData = calculateScoreData(npcHand, true); 
        const pData = calculateScoreData(hand, false); 

        let shouldHit = false;
        if (nData.score < 17) shouldHit = true; 
        else if (nData.score < pData.score && nData.score < 21 && !playerStand) shouldHit = true; 

        if (shouldHit) {
          setNpcActionText('恶魔决定抽牌！');
          setTimeout(() => {
            const { drawn, deck: newDeck, discard: newDiscard } = drawSingleCard(nDeck, nDiscard);
            setNDeck(newDeck); setNDiscard(newDiscard);
            
            if (drawn) {
              let newNpcHand = [...npcHand];
              
              if (drawn.isJoker) {
                 drawn.values = [Math.floor(Math.random() * 6) + 1]; 
                 drawn.rank = `🃏${drawn.values[0]}`;
              }

              if (drawn.isScissor && newNpcHand.length > 0) newNpcHand[newNpcHand.length - 1].isSliced = true;
              newNpcHand.push(drawn); 
              setNpcHand(newNpcHand);
              setTimeout(() => setNpcHand(curr => curr.filter(c => !c.isSliced)), 600);

              const newNData = calculateScoreData(newNpcHand, true);
              if (newNData.isBust) executeResolve(hand, newNpcHand, false);
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
  }, [gameState, turn, npcHand, hand, nDeck, nDiscard, playerStand, npcStand, rollingJoker]);

  // --- 附魔与商店操作 ---
  const applyEnchantToCard = (targetCard) => {
    let updatedCard = { ...targetCard };
    updatedCard.values = [...targetCard.baseValues];
    updatedCard.isScissor = false;
    updatedCard.rank = targetCard.baseRank;

    if (selectedEnchant.type === 'fusion') {
      const newVals = Array.from(new Set([...updatedCard.values, selectedEnchant.value])).sort((a,b)=>a-b);
      updatedCard.values = newVals;
      updatedCard.rank = newVals.join('/');
    } else if (selectedEnchant.type === 'scissor') {
      updatedCard.isScissor = true;
    }

    if (pDeck.find(c => c.id === targetCard.id)) setPDeck(pDeck.map(c => c.id === targetCard.id ? updatedCard : c));
    else setPDiscard(pDiscard.map(c => c.id === targetCard.id ? updatedCard : c));

    setSelectedEnchant(null);
    setShopOffers(generateShopCards());
    setGameState('SHOP');
  };

  const buyCard = (card, idx) => { if (coins >= 4) { setCoins(c=>c-4); setPDiscard(p=>[...p,card]); setShopOffers(p=>p.filter((_,i)=>i!==idx)); } };
  const heal = () => { if (coins >= 5 && hp < MAX_HP) { setCoins(c=>c-5); setHp(h=>h+1); } };
  const handleRemoveCard = (cardId, location) => {
    if (!isRemoving || coins < 3) return;
    setCoins(c => c - 3);
    if (location === 'deck') setPDeck(prev => prev.filter(c => c.id !== cardId));
    else setPDiscard(prev => prev.filter(c => c.id !== cardId));
    setIsRemoving(false);
  };
  
  const nextStage = () => { 
      setStage(s => s + 1);
      setNDiscard(prev => [...prev, generateNpcScalingCard()]);
      startStage(pDeck, pDiscard, nDeck, nDiscard); 
  };

  // --- 渲染辅助 ---
  const pData = calculateScoreData(hand, true);
  const visibleNData = calculateScoreData(npcHand, false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 font-sans select-none overflow-x-hidden relative">
      
      {/* 小丑牌 投掷界面 */}
      {rollingJoker && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
            <h2 className="text-4xl font-black text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse">小丑的赌局！</h2>
            <div className="scale-[1.5] mb-12 relative shadow-[0_0_50px_rgba(168,85,247,0.3)] rounded-xl">
                <Card card={rollingJoker} />
            </div>
            <div className="text-xl font-bold mb-8 text-slate-300 bg-slate-900/80 px-6 py-2 rounded-full border border-purple-500/30 shadow-lg">
                当前手牌总点数: <span className="text-white text-2xl ml-2">{calculateScoreData(hand, true).score}</span>
            </div>
            <div className="flex gap-6">
                <button onClick={handleRollJoker} className="px-6 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(168,85,247,0.5)] flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <span className="flex items-center gap-2"><Dices size={24} /> 投掷 {jokerDiceCount} 颗骰子</span>
                    <span className="text-xs text-purple-200">可能增加 {jokerDiceCount}~{jokerDiceCount * 6} 点</span>
                </button>
                <button onClick={handleStopJoker} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black text-xl flex items-center gap-2 active:scale-95 transition-transform border border-slate-500">
                    ✋ 见好就收
                </button>
            </div>
            <p className="mt-8 text-red-400 font-bold bg-red-900/30 px-4 py-2 rounded">警告：随着投掷次数增加，点数极易失控！</p>
        </div>
      )}

      {/* 技能目标选取遮罩层 */}
      {(isSelectingStuff || isSelectingRedraw) && (
        <div className={`absolute top-24 z-40 text-white px-6 py-3 rounded-full font-bold flex gap-4 items-center shadow-lg animate-bounce cursor-pointer border ${isSelectingStuff ? 'bg-red-900/90 border-red-500 shadow-red-500/50' : 'bg-blue-900/90 border-blue-500 shadow-blue-500/50'}`} onClick={() => { setIsSelectingStuff(false); setIsSelectingRedraw(false); }}>
            <span>{isSelectingStuff ? '点击手牌：将其塞入敌方阵营' : '点击手牌：消耗技能重抽该卡'}</span>
            <span className="bg-slate-900/50 px-2 rounded text-xs">取消</span>
        </div>
      )}

      <div className="w-full max-w-md flex-1 flex flex-col relative z-10">
        
        {/* 顶部状态栏 */}
        <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-sm mb-4 shadow-lg">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">
              <Heart size={18} className={hp === 1 ? 'animate-pulse' : ''} /> {hp}/{MAX_HP}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
              <Coins size={18} /> {coins}
            </div>
          </div>
          <div className="font-black text-indigo-300 tracking-widest text-sm bg-indigo-500/10 px-3 py-1 rounded-lg">
            STAGE {stage}/{MAX_STAGES}
          </div>
        </div>

        {/* ================= START 界面 ================= */}
        {gameState === 'START' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700">
            <div className="text-center relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-30 blur-2xl rounded-full"></div>
              <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-300 drop-shadow-lg relative z-10">深渊对弈</h1>
              <p className="text-sm text-indigo-400 mt-2 font-bold tracking-widest uppercase">战略卡牌构筑</p>
            </div>
            <div className="text-slate-300 text-sm space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <p className="flex items-center gap-2"><Sword size={16} className="text-indigo-400"/> 回合交替：你抽一张，我抽一张的博弈。</p>
              <p className="flex items-center gap-2"><Sparkles size={16} className="text-blue-400"/> 双轨升级：你附魔删牌，恶魔也会随层数强化。</p>
              <p className="flex items-center gap-2"><RefreshCw size={16} className="text-blue-400"/> 战术重抽：指定替换手牌，触发神奇连锁。</p>
              <p className="flex items-center gap-2"><Dices size={16} className="text-purple-400"/> 死亡阶梯：小丑掷骰风险随次数飙升，极度贪婪必死。</p>
            </div>
            <button onClick={startGame} className="group relative px-10 py-4 bg-indigo-600 rounded-full font-black text-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.5)] overflow-hidden">
              <span className="relative z-10 flex items-center gap-2"><Play size={24} /> 跃入深渊</span>
            </button>
          </div>
        )}

        {/* ================= BATTLE / RESOLVE 界面 ================= */}
        {['BATTLE', 'RESOLVE'].includes(gameState) && (
          <div className="flex-1 flex flex-col justify-between pb-4 relative">
            
            {/* NPC 区域 */}
            <div className={`relative flex flex-col items-center transition-all duration-300 ${turn === 'NPC' && gameState === 'BATTLE' && !rollingJoker ? 'ring-2 ring-red-500/50 bg-red-900/10 rounded-3xl pb-2' : ''}`}>
              <div className="absolute -top-6 w-full px-6 flex justify-between text-[10px] text-slate-500 font-bold z-10 pointer-events-none">
                 <span>恶魔牌库:{nDeck.length}</span><span>弃牌:{nDiscard.length}</span>
              </div>
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold border flex items-center gap-2 shadow-lg z-20 ${turn === 'NPC' ? 'bg-red-900 border-red-500 text-red-200 animate-pulse' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                <User size={14} /> 深渊庄家 {visibleNData.score > 0 && !npcHand.some(c=>c.hidden) ? `(${visibleNData.score})` : '(?)'}
                {visibleNData.isFlush && !npcHand.some(c=>c.hidden) && <Sparkles size={12} className="text-blue-400"/>}
              </div>
              <div className="flex justify-center gap-[-40px] flex-wrap w-full bg-slate-900/40 p-8 pt-10 rounded-3xl border-t border-slate-800 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)] min-h-[180px]">
                {npcHand.map((card, idx) => (
                  <div key={card.id + idx} className="relative transition-all duration-500 ease-out" style={{ marginLeft: idx === 0 ? 0 : '-3.5rem', zIndex: idx }}>
                    <Card card={card} />
                  </div>
                ))}
              </div>
              {npcStand && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-1 rounded">庄家已停牌</div>}
            </div>

            {/* 战场中央动态提示区 */}
            <div className="my-2 relative h-16 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

              {npcActionText && gameState === 'BATTLE' && !rollingJoker && (
                <div className="relative z-20 text-sm font-bold bg-slate-900/90 text-red-400 border border-red-900/50 px-6 py-2 rounded-full shadow-2xl animate-pulse">
                  {npcActionText}
                </div>
              )}
              
              {battleMessage.text && (
                <div className={`relative z-30 font-black bg-slate-900/95 px-8 py-4 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md text-center whitespace-nowrap animate-in zoom-in-90 duration-300 ${battleMessage.type}`}>
                  {battleMessage.text}
                </div>
              )}
            </div>

            {/* 玩家区域 */}
            <div className={`relative flex flex-col items-center transition-all duration-300 ${turn === 'PLAYER' && gameState === 'BATTLE' && !rollingJoker ? 'ring-2 ring-indigo-500/50 bg-indigo-900/10 rounded-3xl pb-4 pt-2' : ''}`}>
               {turn === 'PLAYER' && gameState === 'BATTLE' && !rollingJoker && (
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-indigo-600 border border-indigo-400 text-white animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)] z-20">
                   你的回合
                 </div>
               )}
              <div className="absolute -top-6 w-full px-6 flex justify-between text-[10px] text-slate-500 font-bold z-10 pointer-events-none">
                 <span>玩家牌库:{pDeck.length}</span><span>弃牌:{pDiscard.length}</span>
              </div>
              <div className={`flex justify-center gap-[-40px] flex-wrap w-full z-10 min-h-[160px] mt-4 p-4 rounded-xl ${(isSelectingStuff || isSelectingRedraw) ? 'bg-slate-800/50 ring-2 ring-slate-500/50' : ''}`}>
                {hand.map((card, idx) => {
                  const isSelectable = (isSelectingStuff || isSelectingRedraw) && !card.isSliced;
                  const ringColor = isSelectingStuff ? 'ring-red-500' : 'ring-blue-500';
                  return (
                    <div key={card.id + idx} className={`relative transition-all duration-300 transform ${isSelectable ? 'hover:-translate-y-4 hover:z-50 cursor-pointer' : ''}`} style={{ marginLeft: idx === 0 ? 0 : '-3.5rem', zIndex: idx }}>
                      <Card card={card} className={`shadow-[0_10px_20px_rgba(0,0,0,0.3)] ${isSelectable ? `ring-2 ${ringColor}` : ''}`} onClick={() => isSelectable && handleCardClick(card)} />
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                 <div className="bg-indigo-900/40 border border-indigo-500/30 px-6 py-2 rounded-full text-lg font-black text-indigo-300 flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                   点数: <span className="text-2xl text-white">{pData.score}</span>
                   {pData.isFlush && <span className="flex items-center gap-1 text-xs text-blue-300 bg-blue-900/50 px-2 py-1 rounded-md ml-2"><Sparkles size={12}/> 同花</span>}
                 </div>
                 {playerStand && <div className="text-xs font-bold text-indigo-300 bg-indigo-900 px-3 py-2 rounded-full border border-indigo-500/50">已停牌</div>}
              </div>
            </div>

            {/* 操作面板 (2x2 布局) */}
            <div className={`mt-6 grid grid-cols-2 gap-3 transition-opacity duration-300 ${turn === 'NPC' || playerStand || gameState !== 'BATTLE' || rollingJoker ? 'opacity-40 pointer-events-none' : ''}`}>
              
              {/* 抽牌 */}
              <button onClick={handleHit} disabled={isSelectingStuff || isSelectingRedraw} className="bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50">
                <PlusCircle size={20} className="text-green-400" /><span>抽牌 (Hit)</span>
              </button>
              
              {/* 停牌 */}
              <button onClick={handleStand} disabled={isSelectingStuff || isSelectingRedraw} className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50">
                <ShieldAlert size={20} className="text-white" /><span>停牌 (Stand)</span>
              </button>

              {/* 塞牌技能 */}
              <button disabled={skillCharges < 5 || hand.filter(c=>!c.isSliced).length === 0} onClick={handleStuffSkillClick} className={`relative bg-slate-800 hover:bg-slate-700 disabled:opacity-50 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 ${isSelectingStuff ? 'border-red-900 bg-red-900/50' : 'border-slate-900'} active:border-b-0 active:translate-y-1 transition-all overflow-hidden`}>
                <Zap size={20} className={skillCharges >= 5 ? "text-red-400" : "text-slate-600"} />
                <span className={skillCharges >= 5 ? "text-red-400" : "text-slate-500"}>{isSelectingStuff ? '取消塞牌' : '定向塞牌'}</span>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900"><div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(skillCharges/5)*100}%` }}></div></div>
              </button>

              {/* 重抽技能 */}
              <button disabled={redrawCharges < 5 || hand.filter(c=>!c.isSliced).length === 0} onClick={handleRedrawSkillClick} className={`relative bg-slate-800 hover:bg-slate-700 disabled:opacity-50 py-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 ${isSelectingRedraw ? 'border-blue-900 bg-blue-900/50' : 'border-slate-900'} active:border-b-0 active:translate-y-1 transition-all overflow-hidden`}>
                <RefreshCw size={20} className={redrawCharges >= 5 ? "text-blue-400" : "text-slate-600"} />
                <span className={redrawCharges >= 5 ? "text-blue-400" : "text-slate-500"}>{isSelectingRedraw ? '取消重抽' : '卡牌重抽'}</span>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(redrawCharges/5)*100}%` }}></div></div>
              </button>
            </div>
          </div>
        )}

        {/* ================= ENCHANT / SHOP / OVER 界面逻辑与之前一致，省去冗余 ================= */}
        {/* ================= ENCHANT 界面 ================= */}
        {gameState === 'ENCHANT' && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-6"><h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex justify-center items-center gap-2"><Sparkles /> 魔法附魔</h2></div>

            {!selectedEnchant ? (
              <div className="space-y-4">
                {enchantOptions.map((opt, idx) => (
                  <button key={idx} onClick={() => setSelectedEnchant(opt)} className="w-full bg-slate-900 border border-slate-700 p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800 hover:border-indigo-500 transition-all text-left group">
                    <div className="p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform">{opt.icon}</div>
                    <div><div className="font-bold text-lg text-slate-200">{opt.title}</div><div className="text-xs text-slate-500 mt-1">{opt.desc}</div></div>
                  </button>
                ))}
                <button onClick={() => { setShopOffers(generateShopCards()); setGameState('SHOP'); }} className="w-full mt-6 py-4 text-slate-500 font-bold hover:text-white transition-colors">跳过附魔，前往商店</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-xl text-center mb-4 font-bold text-indigo-300 text-sm">
                  请选择要附加【{selectedEnchant.title}】的卡牌
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
                   <div className="grid grid-cols-4 gap-4 justify-items-center">
                     {[...pDeck, ...pDiscard].map(card => (
                       <div key={card.id} onClick={() => applyEnchantToCard(card)} className="scale-90 origin-top cursor-pointer">
                          <Card card={card} isSelectable={true} />
                       </div>
                     ))}
                   </div>
                </div>
                <button onClick={() => setSelectedEnchant(null)} className="mt-4 py-3 bg-slate-800 rounded-xl font-bold">返回重选</button>
              </div>
            )}
          </div>
        )}

        {/* ================= SHOP 界面 ================= */}
        {gameState === 'SHOP' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-2 mb-6 text-xl font-black text-slate-300 border-b border-slate-800 pb-4"><ShoppingCart className="text-yellow-500" /> 深渊黑市</div>

            <div className="space-y-6 flex-1 overflow-y-auto pb-24 px-2">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between"><span>招募强力卡牌 (包含小丑牌)</span><span className="text-yellow-400 flex items-center gap-1">4 <Coins size={14}/></span></h3>
                <div className="flex justify-center gap-4">
                  {shopOffers.length > 0 ? shopOffers.map((card, idx) => (
                    <button key={idx} onClick={() => buyCard(card, idx)} disabled={coins < 4} className="relative group disabled:opacity-40 hover:-translate-y-2 transition-transform">
                      <Card card={card} className="shadow-lg" />
                    </button>
                  )) : ( <div className="text-slate-600 text-sm py-10 font-bold tracking-widest">已售空</div> )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={heal} disabled={coins < 5 || hp >= MAX_HP} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 disabled:opacity-40 hover:bg-slate-800 transition-all">
                  <Heart size={28} className="text-red-500" />
                  <div className="font-bold text-slate-200">恢复 1 点生命</div>
                  <div className="text-sm text-yellow-500 flex items-center gap-1">5 <Coins size={12}/></div>
                </button>

                <button onClick={() => { if(coins >= 3) setIsRemoving(!isRemoving) }} disabled={coins < 3 && !isRemoving} className={`border p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${isRemoving ? 'bg-red-950/50 border-red-500/50' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 disabled:opacity-40'}`}>
                  <Trash2 size={28} className={isRemoving ? "text-red-400" : "text-slate-400"} />
                  <div className="font-bold text-slate-200">{isRemoving ? '请在下方选择' : '遗忘一张卡牌'}</div>
                  <div className="text-sm text-yellow-500 flex items-center gap-1">3 <Coins size={12}/></div>
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between items-center">
                  <span>你的专属牌库 ({pDeck.length + pDiscard.length}张)</span>
                  {isRemoving && <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded animate-pulse border border-red-500/30">点击移除卡牌</span>}
                </h3>
                <div className="grid grid-cols-5 gap-y-4 gap-x-2 p-4 bg-slate-900/30 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto justify-items-center">
                  {[...pDeck, ...pDiscard].map((card, i) => (
                    <div key={card.id + i} onClick={() => handleRemoveCard(card.id, pDeck.find(c=>c.id===card.id) ? 'deck' : 'discard')} className={`scale-[0.6] origin-top -mb-10 ${isRemoving ? 'cursor-pointer hover:ring-8 ring-red-500 rounded-xl hover:-translate-y-4 transition-all' : ''}`}>
                       <Card card={card} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-4 flex justify-center pointer-events-none">
               <button onClick={nextStage} disabled={isRemoving} className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(79,70,229,0.3)] pointer-events-auto active:scale-95">
                  进入 第 {stage + 1} 层深渊 <ArrowRight size={20} />
                </button>
            </div>
          </div>
        )}

        {/* ================= 游戏结束 界面 ================= */}
        {(gameState === 'OVER' || gameState === 'WIN') && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-500 z-50 bg-slate-950/80 backdrop-blur-sm absolute inset-0">
            <div className="text-center">
              {gameState === 'WIN' ? (
                <><Sparkles size={64} className="text-yellow-400 mx-auto mb-6 animate-pulse" /><h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-2xl mb-4">通关</h2><p className="text-slate-300 font-bold tracking-widest">你战胜了深渊的最底层</p></>
              ) : (
                <><h2 className="text-6xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] mb-4">死亡</h2><p className="text-slate-400 font-bold tracking-widest">生命耗尽，止步于 第 {stage} 层</p></>
              )}
            </div>
            
            <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-700 text-center space-y-4 min-w-[280px] backdrop-blur-md">
              <div className="text-xs text-slate-500 tracking-widest font-bold mb-2">最终统计</div>
              <div className="flex justify-between items-center text-lg border-b border-slate-800 pb-2"><span className="text-slate-300">携带金币</span><span className="font-black text-yellow-400 flex items-center gap-1">{coins} <Coins size={18}/></span></div>
              <div className="flex justify-between items-center text-lg border-b border-slate-800 pb-2"><span className="text-slate-300">牌库规模</span><span className="font-black text-white">{pDeck.length + pDiscard.length + hand.length} 张</span></div>
              <div className="flex justify-between items-center text-lg"><span className="text-slate-300">抵达层数</span><span className="font-black text-indigo-400">STAGE {stage}</span></div>
            </div>

            <button onClick={startGame} className="px-10 py-4 bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 rounded-full font-black text-lg flex items-center gap-3 active:scale-95 text-white">
              <RefreshCw size={22} /> 再来一局
            </button>
          </div>
        )}

      </div>
    </div>
  );
}