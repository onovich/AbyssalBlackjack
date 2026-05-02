import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Coins, ShieldAlert, ShoppingCart, ArrowRight, Play, RefreshCw, Trash2, PlusCircle } from 'lucide-react';

// --- 常量与工具函数 ---
const SUITS = [
  { suit: '♠', color: 'text-black' },
  { suit: '♥', color: 'text-red-600' },
  { suit: '♣', color: 'text-black' },
  { suit: '♦', color: 'text-red-600' }
];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const TARGETS = [14, 15, 16, 17, 18, 19, 20, 21]; // 8个阶段的目标点数
const MAX_HP = 3;

const generateId = () => Math.random().toString(36).substr(2, 9);

const createCard = (suitObj, rank) => ({
  id: generateId(),
  suit: suitObj.suit,
  color: suitObj.color,
  rank: rank,
  value: ['J', 'Q', 'K'].includes(rank) ? 10 : rank === 'A' ? 11 : parseInt(rank)
});

// 生成初始牌组 (A-5)
const generateInitialDeck = () => {
  let deck = [];
  ['♠', '♥'].forEach(s => {
    const suitObj = SUITS.find(su => su.suit === s);
    ['A', '2', '3', '4', '5'].forEach(rank => {
      deck.push(createCard(suitObj, rank));
    });
  });
  return shuffle(deck);
};

// 从高级牌池生成商店卡牌
const generateShopCards = () => {
  let cards = [];
  for (let i = 0; i < 3; i++) {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    // 商店更容易出大牌，但也可能出小牌
    const pool = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const rank = pool[Math.floor(Math.random() * pool.length)];
    cards.push(createCard(suit, rank));
  }
  return cards;
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

const calculateScore = (hand) => {
  let score = 0;
  let aces = 0;
  hand.forEach(c => {
    if (c.rank === 'A') {
      aces += 1;
      score += 11;
    } else {
      score += c.value;
    }
  });
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

// --- 组件 ---

const Card = ({ card, className = "" }) => {
  if (!card) return <div className={`w-20 h-28 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-slate-500 ${className}`}>空</div>;
  return (
    <div className={`w-20 h-28 bg-white rounded-lg shadow-md border border-slate-200 flex flex-col justify-between p-2 select-none ${card.color} ${className}`}>
      <span className="text-sm font-bold leading-none">{card.rank}</span>
      <span className="text-3xl self-center">{card.suit}</span>
      <span className="text-sm font-bold leading-none self-end rotate-180">{card.rank}</span>
    </div>
  );
};

export default function RoguelikeBlackjack() {
  const [gameState, setGameState] = useState('START'); // START, BATTLE, RESOLVE, SHOP, OVER, WIN
  const [deck, setDeck] = useState([]);
  const [discard, setDiscard] = useState([]);
  const [hand, setHand] = useState([]);
  const [hp, setHp] = useState(MAX_HP);
  const [coins, setCoins] = useState(0);
  const [stage, setStage] = useState(0);
  
  const [shopOffers, setShopOffers] = useState([]);
  const [battleMessage, setBattleMessage] = useState({ text: '', type: '' });
  const [isRemoving, setIsRemoving] = useState(false);

  // --- 核心逻辑 ---

  const drawCards = (num, currentDeck, currentDiscard, currentHand) => {
    let newDeck = [...currentDeck];
    let newDiscard = [...currentDiscard];
    let newHand = [...currentHand];

    for (let i = 0; i < num; i++) {
      if (newDeck.length === 0) {
        if (newDiscard.length === 0) break; // 彻底没牌了
        newDeck = shuffle(newDiscard);
        newDiscard = [];
      }
      newHand.push(newDeck.pop());
    }
    return { newDeck, newDiscard, newHand };
  };

  const startStage = useCallback((currentDeck = deck, currentDiscard = discard) => {
    const { newDeck, newDiscard, newHand } = drawCards(2, currentDeck, currentDiscard, []);
    setDeck(newDeck);
    setDiscard(newDiscard);
    setHand(newHand);
    setGameState('BATTLE');
    setBattleMessage({ text: '', type: '' });
    
    // 检查天生21点
    if (calculateScore(newHand) === 21) {
       resolveBattle(newHand, true);
    }
  }, [deck, discard, stage]);

  const startGame = () => {
    const initialDeck = generateInitialDeck();
    setHp(MAX_HP);
    setCoins(0);
    setStage(0);
    startStage(initialDeck, []);
  };

  const handleHit = () => {
    const { newDeck, newDiscard, newHand } = drawCards(1, deck, discard, hand);
    setDeck(newDeck);
    setDiscard(newDiscard);
    setHand(newHand);

    const score = calculateScore(newHand);
    if (score > 21) {
      resolveBattle(newHand, false, 'BUST');
    } else if (score === 21) {
      resolveBattle(newHand, true);
    }
  };

  const handleStand = () => {
    resolveBattle(hand, false, 'STAND');
  };

  const resolveBattle = (finalHand, isBlackjack, reason = '') => {
    setGameState('RESOLVE');
    const score = calculateScore(finalHand);
    const target = TARGETS[stage];
    
    let won = false;
    let msg = '';
    let msgType = '';

    if (reason === 'BUST') {
      msg = `爆牌了！点数 ${score}`;
      msgType = 'text-red-500';
      setHp(prev => prev - 1);
    } else {
      if (score >= target) {
        won = true;
        msg = isBlackjack ? `黑杰克！完美通过` : `胜利！${score} 点 ≥ 目标 ${target}`;
        msgType = 'text-green-500';
        setCoins(prev => prev + (isBlackjack ? 5 : 4)); // 赢了给4金币，21点给5
      } else {
        msg = `失败！${score} 点 < 目标 ${target}`;
        msgType = 'text-red-500';
        setHp(prev => prev - 1);
      }
    }

    setBattleMessage({ text: msg, type: msgType });

    setTimeout(() => {
      // 检查游戏结束
      setHp(currentHp => {
        let newHp = currentHp;
        if (reason === 'BUST' || (!won && reason !== 'BUST')) {
          newHp = currentHp - 1; // Double check HP in timeout to ensure state matches
        }
        
        if (newHp <= 0) {
          setGameState('OVER');
        } else if (stage >= TARGETS.length - 1) {
          setGameState('WIN');
        } else {
          // 将手牌加入弃牌堆，进入商店
          setDiscard(prev => [...prev, ...finalHand]);
          setHand([]);
          setShopOffers(generateShopCards());
          setGameState('SHOP');
          setIsRemoving(false);
        }
        return newHp; // We don't actually update it here if we already did, this is just to read the latest. Wait, React batching means we should just read from closure or use functional update carefully.
      });
      
      // Better HP check
      if (hp - (won ? 0 : 1) <= 0) {
          setGameState('OVER');
      } else if (stage >= TARGETS.length - 1) {
          setGameState('WIN');
      } else {
          setDiscard(prev => [...prev, ...finalHand]);
          setHand([]);
          setShopOffers(generateShopCards());
          setGameState('SHOP');
          setIsRemoving(false);
      }

    }, 2000);
  };

  const nextStage = () => {
    setStage(prev => prev + 1);
    startStage();
  };

  // --- 商店操作 ---
  const buyCard = (card, index) => {
    if (coins >= 3) {
      setCoins(prev => prev - 3);
      setDiscard(prev => [...prev, card]);
      // Remove bought card from offers
      setShopOffers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const heal = () => {
    if (coins >= 5 && hp < MAX_HP) {
      setCoins(prev => prev - 5);
      setHp(prev => prev + 1);
    }
  };

  const toggleRemoveMode = () => {
    if (coins >= 4) {
      setIsRemoving(!isRemoving);
    }
  };

  const handleRemoveCard = (cardId, location) => {
    if (!isRemoving || coins < 4) return;
    
    setCoins(prev => prev - 4);
    if (location === 'deck') {
      setDeck(prev => prev.filter(c => c.id !== cardId));
    } else {
      setDiscard(prev => prev.filter(c => c.id !== cardId));
    }
    setIsRemoving(false);
  };

  // --- 渲染辅助 ---
  const score = calculateScore(hand);
  const currentTarget = TARGETS[stage];

  const renderStats = () => (
    <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700 mb-4">
      <div className="flex gap-4">
        <div className="flex items-center gap-1 font-bold text-red-400">
          <Heart size={20} className={hp === 1 ? 'animate-pulse' : ''} /> {hp}/{MAX_HP}
        </div>
        <div className="flex items-center gap-1 font-bold text-yellow-400">
          <Coins size={20} /> {coins}
        </div>
      </div>
      <div className="font-bold text-slate-300">
        第 {stage + 1} 阶段
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 font-sans select-none">
      <div className="w-full max-w-md flex-1 flex flex-col">
        
        {/* 标题栏 */}
        <div className="text-center py-4 mb-2">
          <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm">
            深渊 21 点
          </h1>
          <p className="text-xs text-slate-500">Roguelike Deckbuilder</p>
        </div>

        {/* 开始界面 */}
        {gameState === 'START' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-4 text-slate-400 max-w-sm">
              <p>构建你的专属牌组，挑战越来越严苛的虚拟庄家。</p>
              <ul className="text-sm space-y-2 text-left bg-slate-900 p-4 rounded-lg border border-slate-800">
                <li>• 抽牌直到你的点数 <strong>大于等于目标</strong> 且不超21点。</li>
                <li>• 胜利获得金币，失败扣除生命值。</li>
                <li>• 在商店中购买强力卡牌，或删减累赘卡牌。</li>
              </ul>
            </div>
            <button 
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <Play size={20} /> 开始下潜
            </button>
          </div>
        )}

        {/* 战斗界面 */}
        {(gameState === 'BATTLE' || gameState === 'RESOLVE') && (
          <div className="flex-1 flex flex-col">
            {renderStats()}

            {/* 庄家区域 / 目标 */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-indigo-500/30 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
              <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-slate-400">
                <ShieldAlert size={14} /> 虚拟庄家
              </div>
              <div className="text-center z-10">
                <div className="text-sm text-slate-400 mb-1">目标点数</div>
                <div className="text-5xl font-black text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  {currentTarget}
                </div>
              </div>
            </div>

            {/* 牌库状态 */}
            <div className="flex justify-between text-xs text-slate-500 my-4 px-2">
              <div>抽牌堆: {deck.length}</div>
              <div>弃牌堆: {discard.length}</div>
            </div>

            {/* 玩家区域 */}
            <div className="flex-1 flex flex-col items-center relative">
              <div className="text-sm text-slate-400 mb-2">你的手牌 ( {score} )</div>
              <div className="flex justify-center gap-[-20px] flex-wrap w-full">
                {hand.map((card, idx) => (
                  <div key={card.id} className="relative transition-all duration-300 transform translate-y-0" style={{ marginLeft: idx === 0 ? 0 : '-1.5rem', zIndex: idx }}>
                    <Card card={card} className="shadow-2xl" />
                  </div>
                ))}
              </div>

              {/* 结算提示 */}
              {gameState === 'RESOLVE' && (
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-black bg-slate-950/90 px-6 py-3 rounded-xl border border-slate-700 whitespace-nowrap shadow-2xl z-50 ${battleMessage.type}`}>
                  {battleMessage.text}
                </div>
              )}
            </div>

            {/* 操作面板 */}
            <div className="grid grid-cols-2 gap-4 mt-auto pt-4 pb-8">
              <button 
                disabled={gameState !== 'BATTLE'}
                onClick={handleHit}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-colors border border-slate-600"
              >
                <PlusCircle size={24} />
                拿牌 (Hit)
              </button>
              <button 
                disabled={gameState !== 'BATTLE'}
                onClick={handleStand}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-colors border border-indigo-400"
              >
                <ShieldAlert size={24} />
                停牌 (Stand)
              </button>
            </div>
          </div>
        )}

        {/* 商店界面 */}
        {gameState === 'SHOP' && (
          <div className="flex-1 flex flex-col">
            {renderStats()}
            
            <div className="flex items-center gap-2 mb-4 text-purple-400 font-bold border-b border-slate-800 pb-2">
              <ShoppingCart size={20} /> 局间商店
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pb-20">
              {/* 购卡区 */}
              <div>
                <h3 className="text-sm text-slate-400 mb-3">招募卡牌 (3 <Coins size={12} className="inline text-yellow-400"/>)</h3>
                <div className="flex gap-3 justify-center">
                  {shopOffers.length > 0 ? shopOffers.map((card, idx) => (
                    <button 
                      key={idx}
                      onClick={() => buyCard(card, idx)}
                      disabled={coins < 3}
                      className="relative group disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-2 transition-transform"
                    >
                      <Card card={card} />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-800 text-yellow-400 text-xs px-2 py-1 rounded-full font-bold border border-yellow-600 flex items-center gap-1">
                        3
                      </div>
                    </button>
                  )) : (
                    <div className="text-slate-500 text-sm py-8">已被抢购一空</div>
                  )}
                </div>
              </div>

              {/* 服务区 */}
              <div>
                 <h3 className="text-sm text-slate-400 mb-3">特殊服务</h3>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={heal}
                      disabled={coins < 5 || hp >= MAX_HP}
                      className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex flex-col items-center justify-center gap-2 disabled:opacity-50 hover:bg-slate-700 transition-colors"
                    >
                      <Heart size={24} className="text-red-400" />
                      <div className="text-sm font-bold">恢复 1 HP</div>
                      <div className="text-xs text-yellow-400">5 金币</div>
                    </button>

                    <button 
                      onClick={toggleRemoveMode}
                      disabled={coins < 4 && !isRemoving}
                      className={`border p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${isRemoving ? 'bg-red-900/50 border-red-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 disabled:opacity-50'}`}
                    >
                      <Trash2 size={24} className={isRemoving ? "text-red-400" : "text-slate-400"} />
                      <div className="text-sm font-bold">{isRemoving ? '选择下方卡牌' : '遗忘卡牌'}</div>
                      <div className="text-xs text-yellow-400">4 金币</div>
                    </button>
                 </div>
              </div>

              {/* 牌库查看/删除 */}
              <div>
                <h3 className="text-sm text-slate-400 mb-3 flex justify-between">
                  <span>你的牌库 ({deck.length + discard.length}张)</span>
                  {isRemoving && <span className="text-red-400 text-xs animate-pulse">点击卡牌移除</span>}
                </h3>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-900 rounded-lg border border-slate-800 max-h-48 overflow-y-auto">
                  {deck.map(card => (
                    <div key={card.id} onClick={() => handleRemoveCard(card.id, 'deck')} className={`scale-[0.7] -m-3 origin-top-left ${isRemoving ? 'cursor-pointer hover:ring-2 hover:ring-red-500 rounded-lg' : ''}`}>
                       <Card card={card} />
                    </div>
                  ))}
                  {discard.map(card => (
                    <div key={card.id} onClick={() => handleRemoveCard(card.id, 'discard')} className={`scale-[0.7] -m-3 origin-top-left opacity-70 ${isRemoving ? 'cursor-pointer hover:ring-2 hover:ring-red-500 rounded-lg' : ''}`}>
                       <Card card={card} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 下一关按钮 */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex justify-center">
               <button 
                  onClick={nextStage}
                  disabled={isRemoving}
                  className="w-full max-w-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                  前往第 {stage + 2} 阶段 <ArrowRight size={20} />
                </button>
            </div>
          </div>
        )}

        {/* 结束界面 */}
        {(gameState === 'OVER' || gameState === 'WIN') && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              {gameState === 'WIN' ? (
                <>
                  <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">通关！</h2>
                  <p className="text-slate-300">你击败了最深的深渊庄家。</p>
                </>
              ) : (
                <>
                  <h2 className="text-5xl font-black text-red-500 mb-4">GAME OVER</h2>
                  <p className="text-slate-400">生命值耗尽。止步于第 {stage + 1} 阶段。</p>
                </>
              )}
            </div>
            
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center space-y-2 min-w-[250px]">
              <div className="text-sm text-slate-500">最终战绩</div>
              <div className="flex justify-between items-center text-lg">
                <span>剩余金币</span>
                <span className="font-bold text-yellow-400">{coins} <Coins size={16} className="inline"/></span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span>牌库厚度</span>
                <span className="font-bold">{deck.length + discard.length + hand.length} 张</span>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="px-8 py-3 bg-slate-800 border border-slate-600 hover:bg-slate-700 rounded-full font-bold text-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={20} /> 重新挑战
            </button>
          </div>
        )}

      </div>
    </div>
  );
}