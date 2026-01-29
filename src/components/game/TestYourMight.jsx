import React, { useState, useRef, useEffect, useCallback } from 'react';

const GAME_DURATION = 5;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 240;

const BELT_PROGRESSION = {
  1:  { weight: 45,  targetTaps: 40,  belt: 'White Belt' },
  2:  { weight: 95,  targetTaps: 50,  belt: 'Yellow Belt' },
  3:  { weight: 135, targetTaps: 60,  belt: 'Orange Belt' },
  4:  { weight: 185, targetTaps: 70,  belt: 'Green Belt' },
  5:  { weight: 225, targetTaps: 80,  belt: 'Blue Belt' },
  6:  { weight: 275, targetTaps: 90,  belt: 'Purple Belt' },
  7:  { weight: 315, targetTaps: 100, belt: 'Brown Belt' },
  8:  { weight: 335, targetTaps: 110, belt: 'Red Belt' },
  9:  { weight: 365, targetTaps: 120, belt: 'Black Belt' },
  10: { weight: 405, targetTaps: 130, belt: 'Black Belt II' },
  11: { weight: 435, targetTaps: 140, belt: 'Black Belt III' },
  12: { weight: 450, targetTaps: 150, belt: 'Black Belt Master' },
};

const STATES = { IDLE: 'IDLE', INTRO: 'INTRO', COUNTDOWN: 'COUNTDOWN', ACTIVE: 'ACTIVE', SUCCESS: 'SUCCESS', FAIL: 'FAIL' };

export default function TestYourMight({ isOpen, onClose, weekNumber, benchMax }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);

  const [gameState, setGameState] = useState(STATES.IDLE);
  const [countdownNum, setCountdownNum] = useState(3);
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(3);
  const [flashColor, setFlashColor] = useState(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [introVisible, setIntroVisible] = useState(true);

  const week = Math.min(Math.max(weekNumber || 1, 1), 12);
  const config = BELT_PROGRESSION[week];
  const progress = config.targetTaps > 0 ? Math.min(taps / config.targetTaps, 1) : 0;

  const getTier = useCallback(() => {
    if (progress < 0.25) return 'Big Air';
    if (progress < 0.5) return 'Drive';
    if (progress < 0.75) return 'Stay Tight';
    if (progress < 1) return config.belt;
    return config.belt + ' Master!';
  }, [progress, config.belt]);

  // Reset game
  const resetGame = useCallback(() => {
    setTaps(0);
    setTimeLeft(GAME_DURATION);
    setCountdownNum(3);
    setFlashColor(null);
    setCanvasScale(1);
  }, []);

  // Start game sequence
  const startGame = useCallback(() => {
    resetGame();
    setGameState(STATES.INTRO);
    setIntroVisible(true);

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
              // End game - check result via callback
              setGameState(prev => 'CHECKING');
            }
          }, 100);
          timerRef.current = gameInterval;
        } else {
          setCountdownNum(count);
        }
      }, 1000);
    }, 2000);
  }, [resetGame]);

  // Check result when game ends
  useEffect(() => {
    if (gameState === 'CHECKING') {
      setTaps(currentTaps => {
        const currentProgress = currentTaps / config.targetTaps;
        if (currentProgress >= 0.75) {
          setFlashColor('#00ff00');
          setTimeout(() => setFlashColor(null), 600);
          setGameState(STATES.SUCCESS);
        } else {
          setFlashColor('#ff0000');
          setTimeout(() => setFlashColor(null), 600);
          setLives(l => l - 1);
          setGameState(STATES.FAIL);
        }
        return currentTaps;
      });
    }
  }, [gameState, config.targetTaps]);

  // Auto-start when opened
  useEffect(() => {
    if (isOpen) {
      setLives(3);
      startGame();
    } else {
      setGameState(STATES.IDLE);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, startGame]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Floor
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 200, CANVAS_WIDTH, 40);

      // Determine lifter color based on progress
      let bodyColor = '#4488ff'; // idle blue
      let armY = 160; // arm position (higher = more lifted)
      if (gameState === STATES.ACTIVE || gameState === STATES.SUCCESS) {
        if (progress >= 0.85) {
          bodyColor = '#44cc44';
          armY = 80;
        } else if (progress >= 0.50) {
          bodyColor = '#ffd700';
          armY = 120;
        } else if (progress >= 0.25) {
          bodyColor = '#ff8800';
          armY = 140;
        }
      }

      const cx = CANVAS_WIDTH / 2;

      // Legs
      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - 20, 175, 12, 25);
      ctx.fillRect(cx + 8, 175, 12, 25);

      // Body
      ctx.fillRect(cx - 18, 130, 36, 50);

      // Head
      ctx.beginPath();
      ctx.arc(cx, 118, 14, 0, Math.PI * 2);
      ctx.fillStyle = bodyColor;
      ctx.fill();

      // Arms + barbell
      const barY = armY;
      ctx.fillStyle = bodyColor;
      // Left arm
      ctx.fillRect(cx - 40, barY, 22, 8);
      // Right arm
      ctx.fillRect(cx + 18, barY, 22, 8);

      // Barbell
      ctx.fillStyle = '#aaa';
      ctx.fillRect(cx - 60, barY - 2, 120, 6);
      // Plates
      ctx.fillStyle = '#666';
      ctx.fillRect(cx - 65, barY - 8, 8, 18);
      ctx.fillRect(cx + 57, barY - 8, 8, 18);

      // Weight text on bar
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${config.weight} lbs`, cx, barY - 8);

      // Progress bar at bottom
      ctx.fillStyle = '#333';
      ctx.fillRect(20, 215, 280, 16);
      const barColor = progress >= 1 ? '#44cc44' : progress >= 0.75 ? '#88cc44' : progress >= 0.5 ? '#ffd700' : '#ff4444';
      ctx.fillStyle = barColor;
      ctx.fillRect(20, 215, 280 * progress, 16);
      ctx.strokeStyle = '#555';
      ctx.strokeRect(20, 215, 280, 16);

      // 75% marker
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(20 + 280 * 0.75, 215);
      ctx.lineTo(20 + 280 * 0.75, 231);
      ctx.stroke();
      ctx.setLineDash([]);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, progress, config.weight]);

  const handleTap = () => {
    if (gameState !== STATES.ACTIVE) return;
    setTaps(t => t + 1);
    setCanvasScale(0.98);
    setTimeout(() => setCanvasScale(1), 80);
  };

  const handleTryAgain = () => {
    if (lives <= 0) return;
    startGame();
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: flashColor ? flashColor + '44' : 'rgba(0,0,0,0.92)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, fontFamily: 'Arial, sans-serif', color: '#fff',
    transition: 'background 0.2s',
  };

  const closeBtnStyle = {
    position: 'absolute', top: 12, right: 16, background: 'none', border: 'none',
    color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 10001,
  };

  const canvasStyle = {
    border: '2px solid #667eea', borderRadius: 8,
    transform: `scale(${canvasScale})`, transition: 'transform 0.08s',
    maxWidth: '100%',
  };

  const infoPanelStyle = {
    background: 'rgba(102,126,234,0.15)', borderRadius: 8, padding: 12,
    marginTop: 8, width: CANVAS_WIDTH, maxWidth: '90vw',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 13,
  };

  const tapAreaStyle = {
    cursor: gameState === STATES.ACTIVE ? 'pointer' : 'default',
    userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation',
  };

  const btnStyle = {
    background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none',
    color: '#fff', padding: '12px 32px', borderRadius: 24, fontSize: 16,
    cursor: 'pointer', marginTop: 16, fontWeight: 'bold',
  };

  return (
    <div style={overlayStyle}>
      <button style={closeBtnStyle} onClick={onClose}>&times;</button>

      {gameState === STATES.INTRO && (
        <div style={{ fontSize: 36, fontWeight: 'bold', textAlign: 'center', opacity: introVisible ? 1 : 0.2, transition: 'opacity 0.15s' }}>
          TEST YOUR MIGHT
        </div>
      )}

      {gameState === STATES.COUNTDOWN && (
        <div style={{ fontSize: 80, fontWeight: 'bold' }}>{countdownNum}</div>
      )}

      {(gameState === STATES.ACTIVE || gameState === STATES.SUCCESS || gameState === STATES.FAIL) && (
        <div style={tapAreaStyle} onClick={handleTap} onTouchStart={(e) => { e.preventDefault(); handleTap(); }}>
          {gameState === STATES.ACTIVE && (
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 }}>
              TAP NOW!
            </div>
          )}

          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={canvasStyle} />

          <div style={infoPanelStyle}>
            <div>Week: <strong>{week}</strong></div>
            <div>Weight: <strong>{config.weight} lbs</strong></div>
            <div>Belt Goal: <strong>{config.belt}</strong></div>
            <div>Time Left: <strong>{timeLeft.toFixed(1)}s</strong></div>
            <div>Taps: <strong>{taps} / {config.targetTaps}</strong></div>
            <div>Tier: <strong>{getTier()}</strong></div>
            <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              Lives: {Array.from({ length: 3 }, (_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.3 }}>&#10084;&#65039; </span>
              ))}
            </div>
          </div>

          {gameState === STATES.SUCCESS && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 48 }}>&#127881;</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#44cc44' }}>
                {progress >= 1 ? getTier() : `${config.belt} Achieved!`}
              </div>
              <div style={{ fontSize: 14, marginTop: 4, color: '#aaa' }}>
                {taps} taps in {GAME_DURATION}s &mdash; {Math.round(progress * 100)}%
              </div>
              <button style={btnStyle} onClick={onClose}>Continue</button>
            </div>
          )}

          {gameState === STATES.FAIL && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 48 }}>&#128557;</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#ff4444' }}>
                {lives <= 0 ? 'Game Over!' : 'Not Enough!'}
              </div>
              <div style={{ fontSize: 14, marginTop: 4, color: '#aaa' }}>
                {taps} taps &mdash; needed {Math.ceil(config.targetTaps * 0.75)}
              </div>
              {lives > 0 ? (
                <button style={btnStyle} onClick={handleTryAgain}>Try Again ({lives} {lives === 1 ? 'life' : 'lives'} left)</button>
              ) : (
                <button style={btnStyle} onClick={onClose}>Close</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
