/**
 * QuestionBlock.jsx
 *
 * PURPOSE:
 * A Mario-style animated question mark button for the Interactive Video Chatbot feature.
 * When clicked, it opens a video library of coach explanations/tutorials.
 * The "two cents" coin animation represents "my two cents" - the coach's perspective on movements.
 *
 * INTENDED USE:
 * - Place in top-right corner of the workout tracker/builder
 * - Fixed position, always accessible during workouts
 * - Clicking opens a modal/panel with categorized coaching videos
 * - Videos organized by movement pattern (squat, hinge, press, pull, etc.)
 *
 * DESIGN:
 * - Gold Mario Bros question block with animated shine
 * - Pulses/glows to draw attention
 * - On click: block bounces, two coins with ¢ symbol pop out
 * - "My Two Cents" = coach's perspective/advice
 *
 * RELATED FILES:
 * - See: Interactive_video_chatbot.md for the full decision tree/node system
 * - Videos hosted on Cloudflare Stream
 *
 * TODO:
 * - [ ] Create VideoLibraryModal component
 * - [ ] Connect to Cloudflare video mapping
 * - [ ] Implement decision tree from Interactive_video_chatbot.md
 * - [ ] Add state tracking (confidence, pain flags, form quality)
 */

import React, { useState, useCallback } from 'react';

const styles = {
  // Main question block button
  block: {
    width: 50,
    height: 50,
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'fixed',
    bottom: 20,   // bottom-right on the tracker (top-right = FriendChat)
    right: 20,
    boxShadow: `
      inset 2px 2px 4px rgba(255,255,255,0.4),
      inset -2px -2px 4px rgba(0,0,0,0.2),
      0 4px 15px rgba(255,165,0,0.5)
    `,
    border: '3px solid #8B4513',
    overflow: 'hidden',
    zIndex: 9998,
  },

  // The "?" text
  questionMark: {
    fontSize: 32,
    fontWeight: 900,
    color: '#8B4513',
    textShadow: '1px 1px 0 #FFE4B5, -1px -1px 0 #654321',
    fontFamily: 'Arial Black, Impact, sans-serif',
    transform: 'scaleX(1.7)',
    zIndex: 1,
  },

  // Coin that pops out
  coin: {
    position: 'fixed',
    width: 28,
    height: 28,
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 900,
    color: '#8B4513',
    textShadow: '0 1px 1px rgba(255,255,255,0.5)',
    boxShadow: `
      inset 2px 2px 4px rgba(255,255,255,0.6),
      inset -2px -2px 4px rgba(0,0,0,0.2),
      0 2px 10px rgba(255,165,0,0.8)
    `,
    border: '2px solid #DAA520',
    pointerEvents: 'none',
    zIndex: 10000,
  },
};

// CSS for animations (injected into head)
const animationCSS = `
  @keyframes questionBlockShine {
    0%, 100% { transform: translateX(-100%) rotate(45deg); }
    50% { transform: translateX(100%) rotate(45deg); }
  }

  @keyframes questionBlockPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow:
        inset 2px 2px 4px rgba(255,255,255,0.4),
        inset -2px -2px 4px rgba(0,0,0,0.2),
        0 4px 15px rgba(255,165,0,0.5);
    }
    50% {
      transform: scale(1.05);
      box-shadow:
        inset 2px 2px 4px rgba(255,255,255,0.4),
        inset -2px -2px 4px rgba(0,0,0,0.2),
        0 8px 30px rgba(255,165,0,0.8);
    }
  }

  @keyframes questionBounce {
    0%, 100% { transform: translateY(0) scaleX(1.7); }
    50% { transform: translateY(-2px) scaleX(1.7); }
  }

  @keyframes blockHitBounce {
    0% { transform: scale(1) translateY(0); }
    30% { transform: scale(1.1) translateY(-10px); }
    60% { transform: scale(0.95) translateY(2px); }
    100% { transform: scale(1) translateY(0); }
  }

  @keyframes coinPopLeft {
    0% { opacity: 1; transform: translateY(0) translateX(0) scale(0.5) rotate(0deg); }
    50% { opacity: 1; transform: translateY(-60px) translateX(-20px) scale(1.2) rotate(180deg); }
    100% { opacity: 0; transform: translateY(-90px) translateX(-30px) scale(1) rotate(360deg); }
  }

  @keyframes coinPopRight {
    0% { opacity: 1; transform: translateY(0) translateX(0) scale(0.5) rotate(0deg); }
    50% { opacity: 1; transform: translateY(-70px) translateX(20px) scale(1.2) rotate(-180deg); }
    100% { opacity: 0; transform: translateY(-100px) translateX(35px) scale(1) rotate(-360deg); }
  }

  .question-block {
    animation: questionBlockPulse 2s ease-in-out infinite;
  }

  .question-block::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 40%,
      rgba(255,255,255,0.4) 50%,
      transparent 60%
    );
    animation: questionBlockShine 3s ease-in-out infinite;
  }

  .question-block.hit {
    animation: blockHitBounce 0.3s ease-out;
  }

  .question-mark {
    animation: questionBounce 2s ease-in-out infinite;
  }

  .coin-left {
    animation: coinPopLeft 0.8s ease-out forwards;
  }

  .coin-right {
    animation: coinPopRight 0.8s ease-out forwards;
  }
`;

// Inject animation CSS once
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const styleEl = document.createElement('style');
  styleEl.textContent = animationCSS;
  document.head.appendChild(styleEl);
  stylesInjected = true;
}

export default function QuestionBlock({ onClick }) {
  const [coins, setCoins] = useState([]);
  const [isHit, setIsHit] = useState(false);

  // Inject styles on first render
  React.useEffect(() => {
    injectStyles();
  }, []);

  const handleClick = useCallback((e) => {
    // Trigger hit animation
    setIsHit(true);
    setTimeout(() => setIsHit(false), 300);

    // Spawn two coins
    const rect = e.currentTarget.getBoundingClientRect();
    const coinId = Date.now();

    setCoins(prev => [
      ...prev,
      { id: coinId + 1, direction: 'left', x: rect.left + rect.width/2 - 14, y: rect.top },
      { id: coinId + 2, direction: 'right', x: rect.left + rect.width/2 - 14, y: rect.top },
    ]);

    // Remove coins after animation
    setTimeout(() => {
      setCoins(prev => prev.filter(c => c.id !== coinId + 1 && c.id !== coinId + 2));
    }, 800);

    // Call the onClick handler (opens video library)
    if (onClick) onClick();
  }, [onClick]);

  return (
    <>
      {/* The Question Block */}
      <div
        className={`question-block ${isHit ? 'hit' : ''}`}
        style={styles.block}
        onClick={handleClick}
        title="Coach's Two Cents - Video Tips"
      >
        <span className="question-mark" style={styles.questionMark}>?</span>
      </div>

      {/* Coins that pop out */}
      {coins.map(coin => (
        <div
          key={coin.id}
          className={`coin-${coin.direction}`}
          style={{
            ...styles.coin,
            left: coin.x,
            top: coin.y,
          }}
        >
          ¢
        </div>
      ))}
    </>
  );
}

/**
 * USAGE EXAMPLE:
 *
 * import QuestionBlock from './components/QuestionBlock';
 *
 * function App() {
 *   const [showVideoLibrary, setShowVideoLibrary] = useState(false);
 *
 *   return (
 *     <div>
 *       <QuestionBlock onClick={() => setShowVideoLibrary(true)} />
 *       {showVideoLibrary && <VideoLibraryModal onClose={() => setShowVideoLibrary(false)} />}
 *     </div>
 *   );
 * }
 */
