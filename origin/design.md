Abyssal Blackjack (深渊对弈) - Project Documentation

1. Project Overview

English Name: Abyssal Blackjack
Genre: Roguelike Deckbuilder / Turn-based Card Game
Core Loop: Build deck -> Duel NPC (Blackjack rules) -> Resolve -> Enchant/Shop -> Next Stage (Scaling Difficulty).

2. Local Running Guide (本地运行指南)

This project is built as a single-file React component using Tailwind CSS and lucide-react for icons. To run it locally, Vite is recommended.

Prerequisites

Node.js (v16+)

npm / yarn / pnpm

Setup Steps

Initialize Vite Project:

npm create vite@latest abyssal-blackjack -- --template react
cd abyssal-blackjack
npm install


Install Dependencies:

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install Icons
npm install lucide-react


Configure Tailwind (tailwind.config.js):

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


Add Tailwind Directives (src/index.css):

@tailwind base;
@tailwind components;
@tailwind utilities;


Import Component:

Create src/AbyssalBlackjack.jsx and paste the full generated code into it.

Modify src/App.jsx to render this component:

import AbyssalBlackjack from './AbyssalBlackjack';

function App() {
  return <AbyssalBlackjack />;
}
export default App;


Start Dev Server:

npm run dev


3. Design Document for AI Handoff (设计文档)

Note for AI Assistant: Read this section carefully before modifying or expanding the AbyssalBlackjack.jsx component.

3.1 State Management Architecture

The game relies entirely on React useState and useEffect hooks. It does not use Redux/Zustand, which means state sync heavily relies on closures and hook dependencies.

Core States

gameState: Controls the macro view (START | BATTLE | RESOLVE | ENCHANT | SHOP | OVER | WIN).

turn: Controls the micro flow within BATTLE (PLAYER | NPC).

Deck System: Dual-deck architecture.

pDeck, pDiscard (Player owned)

nDeck, nDiscard (NPC owned)

Hand System:

hand, npcHand (Arrays of Card objects).

Resources: hp, coins, stage.

Skills:

skillCharges (for Stuff skill, max 5).

redrawCharges (for Redraw skill, max 5).

Interactive Modifiers:

rollingJoker: Holds the specific Joker card object currently rolling dice. Pauses the turn loop.

isSelectingStuff / isSelectingRedraw: Booleans blocking regular card interactions and turning the player's hand into selectable targets.

3.2 Card Data Structure (createCard)

Cards are the core entities. Crucial fields to understand:

{
  id: String,          // Unique ID for React keys and targeted deletion
  suit: String,        // Emoji string
  rank: String,        // Display string (e.g., "5/8" for fusion, "🃏12" for joker)
  baseRank: String,    // Original rank string (used to reset enchantments)
  values: Array[Int],  // **CRITICAL**: Array of possible values. e.g., Ace is [1, 11]. Fusion enchant is [5, 8].
  baseValues: Array[Int], // Snapshot of original values before enchantments
  isScissor: Boolean,  // Trigger for slice logic
  isJoker: Boolean,    // Trigger for dice logic
  hidden: Boolean,     // True for NPC's 2nd card. Hides data in calculateScoreData.
  isSliced: Boolean,   // Used for UI animation. If true, card is visually sliced and ignored in calculations, then removed via setTimeout.
  owner: String        // 'PLAYER' or 'NPC'. Ensures cards return to correct discard pile after resolve.
}


3.3 Scoring Engine (calculateScoreData)

This is the most mathematically complex function.

Input: Hand array, calculateAll boolean (ignores hidden flag if true).

Logic:

Filters out isSliced cards.

Checks for Flush (同花): Checks if all visible cards share the same suit. Joker breaking the flush is an intentional design.

Combinatorics: Iterates through all cards. Since values is an array, it creates a Cartesian product of all possible sums.

Flush Bonus: If Flush is active, takes all possible sums and adds variations (sum + 1) and (sum - 1) to the pool of possibilities.

Resolution: Filters out sums > 21. Returns the max valid sum. If all sums > 21, returns isBust = true.

3.4 Key Mechanics Implementation Details

The Scissor Mechanic (剪刀牌)

Trigger: Upon drawing (handleHit, executeRedrawCard) or stuffing (executeStuffCard).

Execution: Looks at the array index n-1 (the card before the scissor). Sets isSliced = true on that card.

Cleanup: A setTimeout(..., 600) is immediately fired to filter out isSliced cards. AI Warning: Relying on timeout closures can cause race conditions if the player clicks too fast. State updater functions setHand(curr => ...) are used to mitigate this.

The Joker Mechanic (小丑牌)

Trigger: Handled in startStage, handleHit, and executeRedrawCard. If drawn, sets rollingJoker state, which renders the modal overlay.

Risk Escalation: jokerDiceCount increments each time the user clicks roll.

Resolution: Passes through resolveAfterJoker which recursively checks if there are other pending Jokers in hand before returning control to the standard turn loop.

The Skill: Redraw (重抽)

Logic: Slices the selected card from the hand array -> Draws a new card -> Inserts new card at the exact same index.

Chain Reaction: If the newly inserted card is a Scissor, it slices the card at index - 1.

NPC AI Behavior

Triggered by useEffect monitoring gameState === 'BATTLE' && turn === 'NPC'.

Calculate its own true score.

Calculate player's visible score.

Decision Tree:

Hit if True Score < 17.

Hit if True Score < Player Visible Score (Cheat peek to force competition).

Stand otherwise.

Uses setTimeout cascades (800ms ~ 1200ms) to simulate "thinking" and UI drawing phases.

3.5 Extension Guidelines for Future AIs

If asked to add new features, follow these constraints:

New Enchantments: Modify enchantOptions state generation in executeResolve. Then add the logic to applyEnchantToCard. You may need to add new flags to the Card object schema.

New Skills: Follow the pattern of isSelectingStuff. Add a charges state, a toggle function, and an execution function (handleCardClick router).

Animations: Add CSS transition classes to Tailwind. Use the isSliced boolean pattern: set flag -> render animation -> use setTimeout to remove from array.