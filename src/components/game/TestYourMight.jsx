import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============================================
// CONSTANTS
// ============================================
const GAME_DURATION = 5;
const SPRITE_WIDTH = 64;
const SPRITE_HEIGHT = 64;
const TOTAL_FRAMES = 13; // 0-10 gameplay, 11 fail, 12 success
const ANIMATION_SPEED = 10;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 240;
const SPRITE_SCALE = 3;

// Asset paths (served from public/)
const ASSETS = {
  spriteOdd: 'assets/game/sprite-overheadpress.png',
  spriteEven: 'assets/game/sprite-overheadpress-black.png',
  musicIntro: 'assets/game/intro.mp3',
  soundWon: 'assets/game/won.mp3',
  soundLose: 'assets/game/losing.mp3',
};

// Frame ranges for animation
const FRAMES = {
  IDLE: [0, 2],
  STRAIN_LOW: [3, 5],
  STRAIN_MED: [6, 8],
  LOCKOUT: [9, 10],
  FAIL: 11,
  SUCCESS: 12,
};

// Belt definitions (8 core belts, each with 5 weeks: base + 4 tips)
const BELTS = [
  { name: 'White Belt',  color: '#FFFFFF', textColor: '#000000', baseWeight: 45,  baseTaps: 30 },
  { name: 'Yellow Belt', color: '#FFFF00', textColor: '#000000', baseWeight: 95,  baseTaps: 40 },
  { name: 'Orange Belt', color: '#FFA500', textColor: '#000000', baseWeight: 135, baseTaps: 50 },
  { name: 'Green Belt',  color: '#228B22', textColor: '#FFFFFF', baseWeight: 185, baseTaps: 60 },
  { name: 'Blue Belt',   color: '#0000FF', textColor: '#FFFFFF', baseWeight: 225, baseTaps: 70 },
  { name: 'Red Belt',    color: '#FF0000', textColor: '#FFFFFF', baseWeight: 275, baseTaps: 80 },
  { name: 'Brown Belt',  color: '#8B4513', textColor: '#FFFFFF', baseWeight: 315, baseTaps: 90 },
  { name: 'Black Belt',  color: '#000000', textColor: '#FFD700', baseWeight: 365, baseTaps: 100 },
];

const TIPS = [
  null,                                                         // base belt week (no tip)
  { name: 'Red Tip',   tipColor: '#FF0000' },
  { name: 'Blue Tip',  tipColor: '#0000FF' },
  { name: 'White Tip', tipColor: '#FFFFFF' },
  { name: 'Black Tip', tipColor: '#000000' },
];

// Build full progression: 8 belts × 5 weeks = 40, then 9 stars, then 2nd degree = 50 weeks
// Beyond 50, keeps repeating at max difficulty
export function getWeekConfig(weekNumber) {
  const w = Math.max(weekNumber || 1, 1);

  // Weeks 1-40: Belt progression with tips
  if (w <= 40) {
    const beltIndex = Math.floor((w - 1) / 5);
    const tipIndex = (w - 1) % 5;
    const belt = BELTS[beltIndex];
    const tip = TIPS[tipIndex];
    const tapIncrease = tipIndex * 3; // each tip adds 3 taps
    const weightIncrease = tipIndex * 5; // each tip adds 5 lbs

    return {
      weight: belt.baseWeight + weightIncrease,
      targetTaps: belt.baseTaps + tapIncrease,
      belt: belt.name,
      tip: tip,
      fullName: tip ? `${belt.name} - ${tip.name}` : belt.name,
      color: belt.color,
      textColor: belt.textColor,
      tipColor: tip?.tipColor || null,
      beltIndex,
      tipIndex,
    };
  }

  // Weeks 41-49: Black Belt Stars (1-9)
  if (w <= 49) {
    const stars = w - 40;
    const bb = BELTS[7]; // Black Belt
    return {
      weight: bb.baseWeight + 20 + (stars * 10),
      targetTaps: bb.baseTaps + 12 + (stars * 4),
      belt: 'Black Belt',
      tip: null,
      fullName: `Black Belt - ${'⭐'.repeat(stars)}`,
      stars,
      color: '#000000',
      textColor: '#FFD700',
      tipColor: null,
      beltIndex: 7,
      tipIndex: 0,
    };
  }

  // Week 50+: 2nd Degree Black Belt (caps here)
  const bb = BELTS[7];
  return {
    weight: bb.baseWeight + 120,
    targetTaps: bb.baseTaps + 50,
    belt: '2nd Degree Black Belt',
    tip: null,
    fullName: '2nd Degree Black Belt',
    color: '#000000',
    textColor: '#FFD700',
    tipColor: null,
    beltIndex: 8,
    tipIndex: 0,
  };
}

// Get the "next goal" message after success
function getCongratsMessage(weekConfig, weekNumber) {
  const w = weekNumber;

  // 2nd degree or beyond
  if (w >= 50) return 'You have achieved the highest rank! True mastery!';

  // Stars phase
  if (w >= 41 && w <= 49) {
    const stars = w - 40;
    if (stars < 9) return `Work hard for ${stars + 1} Star${ stars + 1 > 1 ? 's' : ''} and keep climbing!`;
    return 'One more week and you earn 2nd Degree Black Belt!';
  }

  // Belt + tips phase (weeks 1-40)
  const beltIndex = Math.floor((w - 1) / 5);
  const tipIndex = (w - 1) % 5;
  const currentBelt = BELTS[beltIndex];

  if (tipIndex < 4) {
    // Still have tips left in this belt
    const nextTip = TIPS[tipIndex + 1];
    const isLastTip = tipIndex + 1 === 4;
    const nextBeltName = beltIndex < 7 ? BELTS[beltIndex + 1].name : 'Black Belt Stars';
    if (isLastTip) {
      return `Work hard for the ${nextTip.name} and then you'll be ready for ${nextBeltName}!`;
    }
    return `Next up: ${currentBelt.name} - ${nextTip.name}. Keep pushing!`;
  }

  // Last tip of belt → next belt
  if (beltIndex < 7) {
    return `You've mastered ${currentBelt.name}! Next challenge: ${BELTS[beltIndex + 1].name}!`;
  }
  // Last tip of Black Belt → stars
  return "You've earned your Black Belt! Now it's time to earn your Stars!";
}

const STATES = { IDLE: 'IDLE', INTRO: 'INTRO', COUNTDOWN: 'COUNTDOWN', ACTIVE: 'ACTIVE', SUCCESS: 'SUCCESS', FAIL: 'FAIL' };

export default function TestYourMight({ isOpen, onClose, weekNumber, benchMax }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const spriteRef = useRef(null);
  const musicRef = useRef(null);
  const wonSoundRef = useRef(null);
  const loseSoundRef = useRef(null);
  const animTickRef = useRef(0);
  const currentFrameRef = useRef(0);
  const tapsRef = useRef(0);

  const [gameState, setGameState] = useState(STATES.IDLE);
  const [countdownNum, setCountdownNum] = useState(3);
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(3);
  const [flashColor, setFlashColor] = useState(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [introVisible, setIntroVisible] = useState(true);

  const week = Math.max(weekNumber || 1, 1);
  const config = getWeekConfig(week);
  const progress = config.targetTaps > 0 ? Math.min(taps / config.targetTaps, 1) : 0;

  // Get tier info (matches old chatbot logic)
  const getTierInfo = useCallback(() => {
    if (progress < 0.25) return { name: 'Big Air', color: '#4169E1', textColor: '#FFFFFF' };
    if (progress < 0.5) return { name: 'Drive', color: '#FF8C00', textColor: '#FFFFFF' };
    if (progress < 0.75) return { name: 'Stay Tight', color: '#FFD700', textColor: '#000000' };
    if (progress < 1.0) return { name: config.fullName, color: config.color, textColor: config.textColor };
    return { name: config.fullName + ' Master!', color: config.color, textColor: config.textColor };
  }, [progress, config]);

  // ============================================
  // ASSET LOADING
  // ============================================
  useEffect(() => {
    if (!isOpen) return;

    // Load sprite sheet (alternate based on even/odd week)
    const sprite = new Image();
    sprite.src = week % 2 === 0 ? ASSETS.spriteEven : ASSETS.spriteOdd;
    spriteRef.current = sprite;

    // Load audio
    if (!musicRef.current) {
      musicRef.current = new Audio(ASSETS.musicIntro);
      musicRef.current.volume = 0.6;
      musicRef.current.preload = 'auto';
    }
    if (!wonSoundRef.current) {
      wonSoundRef.current = new Audio(ASSETS.soundWon);
      wonSoundRef.current.volume = 0.7;
      wonSoundRef.current.preload = 'auto';
    }
    if (!loseSoundRef.current) {
      loseSoundRef.current = new Audio(ASSETS.soundLose);
      loseSoundRef.current.volume = 0.7;
      loseSoundRef.current.preload = 'auto';
    }
  }, [isOpen, week]);

  // ============================================
  // AUDIO HELPERS
  // ============================================
  const playMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.currentTime = 0;
      musicRef.current.play().catch(() => {});
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    [musicRef, wonSoundRef, loseSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  }, []);

  const playSound = useCallback((ref) => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.currentTime = 0;
        ref.current.play().catch(() => {});
      }
    }, 100);
  }, []);

  // ============================================
  // SPRITE RENDERING
  // ============================================
  const drawSprite = useCallback((ctx) => {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const sprite = spriteRef.current;
    if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
      const sx = currentFrameRef.current * SPRITE_WIDTH;
      const dx = (CANVAS_WIDTH - SPRITE_WIDTH * SPRITE_SCALE) / 2;
      const dy = (CANVAS_HEIGHT - SPRITE_HEIGHT * SPRITE_SCALE) / 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, sx, 0, SPRITE_WIDTH, SPRITE_HEIGHT, dx, dy, SPRITE_WIDTH * SPRITE_SCALE, SPRITE_HEIGHT * SPRITE_SCALE);
    } else {
      // Fallback: simple placeholder
      const p = config.targetTaps > 0 ? Math.min(tapsRef.current / config.targetTaps, 1.0) : 0;
      ctx.fillStyle = '#FFD700';
      const lifterY = 160 - (p * 60);
      ctx.fillRect(140, lifterY, 40, 60);
      ctx.beginPath();
      ctx.arc(160, lifterY - 10, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(100, lifterY - 30, 120, 8);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(80, lifterY - 40, 20, 28);
      ctx.fillRect(220, lifterY - 40, 20, 28);
    }

    // Progress bar
    const p = config.targetTaps > 0 ? Math.min(tapsRef.current / config.targetTaps, 1.0) : 0;
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 215, 280, 18);
    const barColor = p >= 1 ? '#00FF00' : p >= 0.75 ? '#88cc44' : p >= 0.5 ? '#FFD700' : p >= 0.3 ? '#FF8C00' : '#FF0000';
    ctx.fillStyle = barColor;
    ctx.fillRect(20, 215, 280 * p, 18);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(20, 215, 280, 18);

    // 75% threshold marker
    ctx.strokeStyle = '#FFFFFF';
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(20 + 280 * 0.75, 215);
    ctx.lineTo(20 + 280 * 0.75, 233);
    ctx.stroke();
    ctx.setLineDash([]);

    // Percentage text
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(p * 100)}%`, 160, 229);
  }, [config.targetTaps]);

  // ============================================
  // FRAME SELECTION (matches old chatbot logic)
  // ============================================
  const updateFrame = useCallback((state) => {
    if (state === STATES.INTRO || state === STATES.COUNTDOWN) {
      currentFrameRef.current = 0;
      return;
    }
    if (state === STATES.SUCCESS) {
      currentFrameRef.current = FRAMES.SUCCESS;
      return;
    }
    if (state === STATES.FAIL) {
      currentFrameRef.current = FRAMES.FAIL;
      return;
    }
    if (state === STATES.ACTIVE) {
      if (tapsRef.current === 0) {
        currentFrameRef.current = 0;
        return;
      }
      const p = config.targetTaps > 0 ? Math.min(tapsRef.current / config.targetTaps, 1.0) : 0;
      let range;
      if (p < 0.25) range = FRAMES.IDLE;
      else if (p < 0.5) range = FRAMES.STRAIN_LOW;
      else if (p < 0.85) range = FRAMES.STRAIN_MED;
      else range = FRAMES.LOCKOUT;

      const rangeSize = range[1] - range[0] + 1;
      const cycleFrame = Math.floor(animTickRef.current / ANIMATION_SPEED) % rangeSize;
      currentFrameRef.current = range[0] + cycleFrame;
      animTickRef.current++;
    }
  }, [config.targetTaps]);

  // ============================================
  // GAME RESET
  // ============================================
  const resetGame = useCallback(() => {
    tapsRef.current = 0;
    animTickRef.current = 0;
    currentFrameRef.current = 0;
    setTaps(0);
    setTimeLeft(GAME_DURATION);
    setCountdownNum(3);
    setFlashColor(null);
    setCanvasScale(1);
  }, []);

  // ============================================
  // GAME SEQUENCE
  // ============================================
  const startGame = useCallback(() => {
    resetGame();
    setGameState(STATES.INTRO);
    setIntroVisible(true);
    playMusic();

    // Flash intro text
    const flashInterval = setInterval(() => {
      setIntroVisible(v => !v);
    }, 300);

    setTimeout(() => {
      clearInterval(flashInterval);
      setIntroVisible(true);
      setGameState(STATES.COUNTDOWN);
      setCountdownNum(3);

      let count = 3;
      const cdInterval = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(cdInterval);
          setGameState(STATES.ACTIVE);
          setTimeLeft(GAME_DURATION);

          let remaining = GAME_DURATION;
          const gameInterval = setInterval(() => {
            remaining -= 0.1;
            setTimeLeft(Math.max(0, remaining));
            if (remaining <= 0) {
              clearInterval(gameInterval);
              setGameState('CHECKING');
            }
          }, 100);
          timerRef.current = gameInterval;
        } else {
          setCountdownNum(count);
        }
      }, 1000);
    }, 2000);
  }, [resetGame, playMusic]);

  // ============================================
  // END GAME CHECK
  // ============================================
  useEffect(() => {
    if (gameState === 'CHECKING') {
      // Stop music
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.currentTime = 0;
      }

      setTaps(currentTaps => {
        const currentProgress = currentTaps / config.targetTaps;
        if (currentProgress >= 0.75) {
          currentFrameRef.current = FRAMES.SUCCESS;
          setFlashColor('#00ff00');
          setTimeout(() => setFlashColor(null), 600);
          setGameState(STATES.SUCCESS);
          playSound(wonSoundRef);
          setLives(3); // Reset lives on success
        } else {
          currentFrameRef.current = FRAMES.FAIL;
          setFlashColor('#ff0000');
          setTimeout(() => setFlashColor(null), 600);
          setLives(l => l - 1);
          setGameState(STATES.FAIL);
          playSound(loseSoundRef);
        }
        return currentTaps;
      });
    }
  }, [gameState, config.targetTaps, playSound]);

  // ============================================
  // DESTROY AUDIO (fully remove Audio objects)
  // ============================================
  const destroyAllAudio = useCallback(() => {
    [musicRef, wonSoundRef, loseSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.removeAttribute('src');
        ref.current.load();
        ref.current = null;
      }
    });
  }, []);

  // ============================================
  // AUTO-START / CLEANUP
  // ============================================
  useEffect(() => {
    if (isOpen) {
      setLives(3);
      startGame();
    } else {
      setGameState(STATES.IDLE);
      destroyAllAudio();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      destroyAllAudio();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, startGame, destroyAllAudio]);

  // Pause audio when tab/window loses focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopAllAudio();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopAllAudio]);

  // ============================================
  // RENDER LOOP
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      updateFrame(gameState);
      drawSprite(ctx);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, gameState, drawSprite, updateFrame]);

  // Sync tapsRef with state
  useEffect(() => {
    tapsRef.current = taps;
  }, [taps]);

  // ============================================
  // TAP HANDLER
  // ============================================
  const handleTap = () => {
    if (gameState !== STATES.ACTIVE) return;
    setTaps(t => t + 1);
    setCanvasScale(0.98);
    setTimeout(() => setCanvasScale(1), 80);
  };

  const handleTryAgain = () => {
    if (lives <= 0) return;
    stopAllAudio();
    startGame();
  };

  const handleClose = () => {
    destroyAllAudio();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  if (!isOpen) return null;

  const tier = getTierInfo();

  // Determine end-game messages (matches old chatbot)
  let mainMessage = '';
  let funnyMessage = '';
  let mainBg = '#667eea';
  let mainTextColor = '#FFFFFF';

  if (gameState === STATES.SUCCESS) {
    mainMessage = tier.name;
    mainBg = tier.color;
    mainTextColor = tier.textColor;
    funnyMessage = progress >= 1.0 ? '💪 Beast Mode!' : 'Spotter helped 😏';
  } else if (gameState === STATES.FAIL) {
    if (progress >= 0.60) {
      mainMessage = 'SO CLOSE';
      mainBg = '#FF8C00';
    } else {
      mainMessage = 'Not even close';
      mainBg = '#DC143C';
    }
    funnyMessage = "Spotter's doing curls 😅";
  }

  // ============================================
  // STYLES
  // ============================================
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: flashColor ? flashColor + '44' : 'rgba(0,0,0,0.95)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, fontFamily: "'Press Start 2P', 'Arial', cursive", color: '#fff',
    transition: 'background 0.2s', overflowY: 'auto',
  };

  const canvasStyle = {
    border: '4px solid #FFD700', background: '#1a1a1a',
    transform: `scale(${canvasScale})`, transition: 'transform 0.05s',
    maxWidth: '100%', imageRendering: 'pixelated', cursor: gameState === STATES.ACTIVE ? 'pointer' : 'default',
  };

  const titleStyle = {
    fontSize: 'clamp(16px, 5vw, 24px)', color: '#FFD700', marginBottom: 20,
    textShadow: '3px 3px 0px #8B0000',
    animation: 'pulse 2s infinite',
  };

  const infoPanelStyle = {
    display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 10,
    marginTop: 16, padding: 12, background: '#1a1a1a', border: '3px solid #FFD700',
    fontSize: 'clamp(9px, 2.5vw, 12px)', width: CANVAS_WIDTH * 2, maxWidth: '95vw',
  };

  const statStyle = { color: '#FFF' };
  const statValueStyle = { color: '#FFD700', fontSize: 'clamp(10px, 3vw, 14px)' };

  const tierBadgeStyle = {
    color: tier.textColor, background: tier.color,
    padding: '4px 8px', borderRadius: 4, display: 'inline-block',
  };

  const btnStyle = {
    marginTop: 16, padding: '12px 24px', fontFamily: "Arial, sans-serif",
    fontSize: 'clamp(12px, 3vw, 16px)', fontWeight: 'bold', textTransform: 'uppercase',
    background: '#8B0000', border: '3px solid #FFD700',
    color: '#FFFFFF', cursor: 'pointer', transition: 'all 0.3s',
    letterSpacing: '1px',
  };

  const closeBtnStyle = {
    position: 'absolute', top: 12, right: 16, background: 'none', border: 'none',
    color: '#FFD700', fontSize: 28, cursor: 'pointer', zIndex: 10001,
    fontFamily: 'Arial, sans-serif',
  };

  const tapAreaStyle = {
    userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  };

  const resultBannerStyle = {
    fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 'bold', marginBottom: 12,
    color: mainTextColor, background: mainBg, padding: 12, borderRadius: 10,
    textAlign: 'center',
  };

  const funnyStyle = {
    fontSize: 'clamp(10px, 3vw, 14px)', fontStyle: 'italic',
    color: gameState === STATES.SUCCESS ? '#FFD700' : '#FF6B6B', marginTop: 8,
  };

  return (
    <div style={overlayStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <button style={closeBtnStyle} onClick={handleClose}>&times;</button>

      {/* INTRO */}
      {gameState === STATES.INTRO && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...titleStyle, opacity: introVisible ? 1 : 0.2, transition: 'opacity 0.15s', fontSize: 'clamp(18px, 6vw, 28px)' }}>
            TEST YOUR MIGHT
          </div>
          <div style={{ fontSize: 'clamp(9px, 2.5vw, 12px)', color: '#FFF', marginTop: 10 }}>
            Week {week} &mdash; {config.fullName}
          </div>
          {config.tipColor && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 40, height: 8, background: config.color, border: '1px solid #555' }} />
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: config.tipColor, border: '2px solid #FFD700' }} />
            </div>
          )}
        </div>
      )}

      {/* COUNTDOWN */}
      {gameState === STATES.COUNTDOWN && (
        <div style={{ fontSize: 'clamp(48px, 15vw, 80px)', fontWeight: 'bold', color: '#FFD700', textShadow: '3px 3px 0 #8B0000' }}>
          {countdownNum}
        </div>
      )}

      {/* ACTIVE / SUCCESS / FAIL */}
      {(gameState === STATES.ACTIVE || gameState === STATES.SUCCESS || gameState === STATES.FAIL) && (
        <div style={tapAreaStyle} onClick={handleTap} onTouchStart={(e) => { e.preventDefault(); handleTap(); }}>
          {gameState === STATES.ACTIVE && (
            <div style={{ textAlign: 'center', fontSize: 'clamp(14px, 4vw, 20px)', color: '#FFD700', marginBottom: 8, animation: 'flash 0.5s infinite' }}>
              TAP NOW!
            </div>
          )}

          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={canvasStyle} />

          {/* Info Panel */}
          <div style={infoPanelStyle}>
            <div style={statStyle}>Week: <span style={statValueStyle}>{week}</span></div>
            <div style={statStyle}>Weight: <span style={statValueStyle}>{config.weight} lbs</span></div>
            <div style={statStyle}>Rank: <span style={statValueStyle}>{config.fullName} 🥋</span></div>
            <div style={statStyle}>Time: <span style={statValueStyle}>{timeLeft.toFixed(1)}s</span></div>
            <div style={statStyle}>Tier: <span style={tierBadgeStyle}>{tier.name}</span></div>
            <div style={statStyle}>
              Lives: {'❤️'.repeat(Math.max(lives, 0))}{'🖤'.repeat(Math.max(3 - lives, 0))}
            </div>
          </div>

          {/* SUCCESS */}
          {gameState === STATES.SUCCESS && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={resultBannerStyle}>{mainMessage}</div>
              <div style={funnyStyle}>{funnyMessage}</div>
              <div style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', marginTop: 8, color: '#aaa' }}>
                {taps} taps in {GAME_DURATION}s &mdash; {Math.round(progress * 100)}%
              </div>
              <div style={{ fontSize: 'clamp(9px, 2.5vw, 12px)', marginTop: 12, color: '#FFD700', padding: '8px 12px', background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD700', borderRadius: 6, maxWidth: 340 }}>
                Congrats on earning <strong>{config.fullName}</strong>!<br />
                {getCongratsMessage(config, week)}
              </div>
              <button style={btnStyle} onClick={handleClose}>Continue</button>
            </div>
          )}

          {/* FAIL */}
          {gameState === STATES.FAIL && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              {lives <= 0 ? (
                <>
                  <div style={{ ...resultBannerStyle, background: '#8B0000' }}>GAME OVER</div>
                  <div style={{ fontSize: 'clamp(10px, 3vw, 14px)', color: '#FF6B6B', marginTop: 8 }}>Better luck next time!</div>
                </>
              ) : (
                <>
                  <div style={resultBannerStyle}>{mainMessage}</div>
                  <div style={funnyStyle}>{funnyMessage}</div>
                </>
              )}
              <div style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', marginTop: 8, color: '#aaa' }}>
                {taps} taps &mdash; needed {Math.ceil(config.targetTaps * 0.75)}
              </div>
              {lives > 0 ? (
                <button style={btnStyle} onClick={handleTryAgain}>Try Again ({lives} {lives === 1 ? 'life' : 'lives'})</button>
              ) : (
                <button style={btnStyle} onClick={handleClose}>Close</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
