
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Direction, Position, GameState } from './types';
import { GRID_SIZE, CELL_SIZE_PX, BOARD_DIMENSION_PX, INITIAL_SPEED_MS, HUNGER_DURATION_MS, PINNI_EMOJI, FOOD_EMOJI } from './constants';

const getRandomPosition = (avoidPos?: Position): Position => {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (avoidPos && pos.x === avoidPos.x && pos.y === avoidPos.y);
  return pos;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Idle);
  const [pinniPos, setPinniPos] = useState<Position>({ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) });
  const [foodPos, setFoodPos] = useState<Position>(getRandomPosition(pinniPos));
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [lastFedTime, setLastFedTime] = useState<number>(Date.now());
  const [showMeow, setShowMeow] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>(`Feed Pinni ${PINNI_EMOJI} with ${FOOD_EMOJI} or she will die!`);
  const [hungerPercentage, setHungerPercentage] = useState<number>(100);

  const gameTickRef = useRef<number | null>(null);
  
  const pinniPosRef = useRef(pinniPos);
  const foodPosRef = useRef(foodPos);
  const lastFedTimeRef = useRef(lastFedTime);
  const directionRef = useRef(direction);
  const gameStateRef = useRef(gameState);

  useEffect(() => { pinniPosRef.current = pinniPos; }, [pinniPos]);
  useEffect(() => { foodPosRef.current = foodPos; }, [foodPos]);
  useEffect(() => { lastFedTimeRef.current = lastFedTime; }, [lastFedTime]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);


  const startGame = useCallback(() => {
    const initialPinniPos = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
    setPinniPos(initialPinniPos);
    setFoodPos(getRandomPosition(initialPinniPos));
    setDirection(Direction.RIGHT);
    const now = Date.now();
    setLastFedTime(now);
    lastFedTimeRef.current = now; // Ensure ref is also updated immediately
    setCurrentMessage('');
    setGameState(GameState.Playing);
    setShowMeow(false);
    setHungerPercentage(100);
  }, []);

  const handleDirectionChange = useCallback((newDirection: Direction) => {
    const currentDir = directionRef.current;
    if (currentDir === Direction.UP && newDirection === Direction.DOWN) return;
    if (currentDir === Direction.DOWN && newDirection === Direction.UP) return;
    if (currentDir === Direction.LEFT && newDirection === Direction.RIGHT) return;
    if (currentDir === Direction.RIGHT && newDirection === Direction.LEFT) return;
    setDirection(newDirection);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current === GameState.Playing) {
        switch (e.key) {
          case 'ArrowUp': case 'w': case 'W': handleDirectionChange(Direction.UP); break;
          case 'ArrowDown': case 's': case 'S': handleDirectionChange(Direction.DOWN); break;
          case 'ArrowLeft': case 'a': case 'A': handleDirectionChange(Direction.LEFT); break;
          case 'ArrowRight': case 'd': case 'D': handleDirectionChange(Direction.RIGHT); break;
        }
      } else if ((gameStateRef.current === GameState.GameOver || gameStateRef.current === GameState.Idle) && e.key === 'Enter') {
        startGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirectionChange, startGame]);


  useEffect(() => {
    if (gameState !== GameState.Playing) {
      if (gameTickRef.current) clearInterval(gameTickRef.current);
      return;
    }

    const updateGame = () => {
      if (gameStateRef.current !== GameState.Playing) {
        if (gameTickRef.current) clearInterval(gameTickRef.current);
        return;
      }

      let currentPPos = pinniPosRef.current;
      let newX = currentPPos.x;
      let newY = currentPPos.y;

      switch (directionRef.current) {
        case Direction.UP: newY--; break;
        case Direction.DOWN: newY++; break;
        case Direction.LEFT: newX--; break;
        case Direction.RIGHT: newX++; break;
      }

      if (newX < 0) newX = GRID_SIZE - 1; else if (newX >= GRID_SIZE) newX = 0;
      if (newY < 0) newY = GRID_SIZE - 1; else if (newY >= GRID_SIZE) newY = 0;
      
      const nextPinniPos = { x: newX, y: newY };
      setPinniPos(nextPinniPos);

      if (nextPinniPos.x === foodPosRef.current.x && nextPinniPos.y === foodPosRef.current.y) {
        const now = Date.now();
        setLastFedTime(now);
        lastFedTimeRef.current = now; // Ensure ref is also updated immediately
        setHungerPercentage(100);
        setShowMeow(true);
        setTimeout(() => setShowMeow(false), 800);
        
        let newFoodCandidate;
        do {
            newFoodCandidate = getRandomPosition();
        } while (newFoodCandidate.x === nextPinniPos.x && newFoodCandidate.y === nextPinniPos.y);
        setFoodPos(newFoodCandidate);
      }

      const elapsedTime = Date.now() - lastFedTimeRef.current;
      const newHungerPercentage = Math.max(0, ((HUNGER_DURATION_MS - elapsedTime) / HUNGER_DURATION_MS) * 100);
      setHungerPercentage(newHungerPercentage);

      if (elapsedTime > HUNGER_DURATION_MS) {
        setGameState(GameState.GameOver);
        setCurrentMessage(`Pinni ${PINNI_EMOJI} died of hunger!`);
        if (gameTickRef.current) clearInterval(gameTickRef.current);
      }
    };

    gameTickRef.current = setInterval(updateGame, INITIAL_SPEED_MS);

    return () => {
      if (gameTickRef.current) clearInterval(gameTickRef.current);
    };
  }, [gameState, startGame]); // Added startGame to deps as it's used for restart logic.

  const controlButtonClasses = "bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-5 rounded-lg shadow-md transition-colors duration-150 text-2xl aspect-square flex items-center justify-center";

  return (
    <div className="min-h-screen bg-pink-100 flex flex-col items-center justify-center p-4 selection:bg-pink-300 selection:text-pink-800">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-pink-700 tracking-tight">Pinni the Cat</h1>
        {gameState === GameState.Idle && <p className="text-lg text-pink-600 mt-2">{currentMessage} Press Enter or Start.</p>}
        {gameState === GameState.Playing && <p className="text-lg text-pink-600 mt-2">Feed Pinni! Don't let her starve!</p>}
        {gameState === GameState.GameOver && <p className="text-lg text-red-600 font-semibold mt-2">{currentMessage} Press Enter or Restart.</p>}
      </div>

      <div 
        className="relative bg-pink-200 border-4 border-pink-400 rounded-lg shadow-xl overflow-hidden"
        style={{ width: BOARD_DIMENSION_PX, height: BOARD_DIMENSION_PX }}
        role="grid"
        aria-label="Pinni the Cat game board"
      >
        {/* Pinni the Cat */}
        <div 
          className="absolute emoji-personagem"
          style={{ 
            left: pinniPos.x * CELL_SIZE_PX, 
            top: pinniPos.y * CELL_SIZE_PX,
            width: CELL_SIZE_PX,
            height: CELL_SIZE_PX,
            transition: 'left 0.1s linear, top 0.1s linear'
          }}
          aria-label="Pinni the cat"
        >
          {PINNI_EMOJI}
        </div>

        {/* Food */}
        <div 
          className="absolute emoji-personagem"
          style={{ 
            left: foodPos.x * CELL_SIZE_PX, 
            top: foodPos.y * CELL_SIZE_PX,
            width: CELL_SIZE_PX,
            height: CELL_SIZE_PX
          }}
          aria-label="Potato chips food"
        >
          {FOOD_EMOJI}
        </div>

        {/* Meow Tooltip */}
        {showMeow && (
          <div 
            className="absolute bg-white text-pink-600 p-2 rounded-md shadow-lg text-sm font-semibold z-10 animate-pulse"
            style={{
              left: pinniPos.x * CELL_SIZE_PX + CELL_SIZE_PX / 2 - 25, 
              top: pinniPos.y * CELL_SIZE_PX - 30, 
              minWidth: '50px',
              textAlign: 'center'
            }}
            role="status"
            aria-live="polite"
          >
            Meow!
          </div>
        )}
      </div>

      {/* Hunger Bar */}
      {gameState === GameState.Playing && (
        <div className="mt-4" style={{ width: BOARD_DIMENSION_PX }}>
          <div className="text-sm text-pink-700 font-medium mb-1 text-center">Hunger Level</div>
          <div 
            className="w-full bg-pink-300 h-5 rounded-md overflow-hidden border-2 border-pink-400 shadow-inner"
            role="progressbar"
            aria-valuenow={Math.round(hungerPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Pinni's hunger level"
          >
            <div 
              className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-150 ease-linear"
              style={{ width: `${hungerPercentage}%` }}
            >
            </div>
          </div>
        </div>
      )}

      {(gameState === GameState.Idle || gameState === GameState.GameOver) && (
        <button 
          onClick={startGame}
          className="mt-8 bg-pink-500 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg text-xl transition-all duration-150 transform hover:scale-105"
          aria-label={gameState === GameState.Idle ? 'Start Game' : 'Restart Game'}
        >
          {gameState === GameState.Idle ? 'Start Game' : 'Restart Game'}
        </button>
      )}

      <div className="mt-8 grid grid-cols-3 gap-3 w-64 md:w-72" aria-label="Game controls">
        <div></div> 
        <button 
            onClick={() => gameState === GameState.Playing && handleDirectionChange(Direction.UP)} 
            className={controlButtonClasses}
            disabled={gameState !== GameState.Playing}
            aria-label="Move Pinni up"
        >↑</button>
        <div></div> 
        <button 
            onClick={() => gameState === GameState.Playing && handleDirectionChange(Direction.LEFT)} 
            className={controlButtonClasses}
            disabled={gameState !== GameState.Playing}
            aria-label="Move Pinni left"
        >←</button>
        <button 
            onClick={() => gameState === GameState.Playing && handleDirectionChange(Direction.DOWN)} 
            className={controlButtonClasses}
            disabled={gameState !== GameState.Playing}
            aria-label="Move Pinni down"
        >↓</button>
        <button 
            onClick={() => gameState === GameState.Playing && handleDirectionChange(Direction.RIGHT)} 
            className={controlButtonClasses}
            disabled={gameState !== GameState.Playing}
            aria-label="Move Pinni right"
        >→</button>
      </div>
    </div>
  );
};

export default App;
