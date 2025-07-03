function loadSnakeGame(container) {
    // --- CONSTANTS & CONFIG ---
    const GRID_SIZE = 20; const TILE_COUNT = 25; const CANVAS_SIZE = GRID_SIZE * TILE_COUNT;
    const BONUS_FOOD_DURATION = 5000; const EAT_SOUND_POOL_SIZE = 4;
    const BONUS_ANIMAL_MAP = ["0110","1001","1111","1001","0110"];

    // --- COLORS & STYLES ---
    const SNAKE_DEFAULT_COLOR = '#2de2e6'; const REGULAR_FOOD_COLORS = ['#fef001', '#0ff000', '#00f0ff', '#ff00ff', '#ff8c00'];
    const BONUS_FOOD_COLOR = '#ff5733'; const BORDER_PULSE_COLORS = ['#f907fc', '#fc3a07', '#f4f40a', '#0af40a', '#0af4f4'];

    // --- AUDIO SOURCES (Base64 encoded) ---
    const SOUND_EAT_SRC = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU0AAAAAAAA/D4H/fh8B/3UgBv/lIRf/qyAX/8IgDf/PIAz/0B8C/zEhBP/aHwP/eyEE//QgCP/LIAn/xR8B/3MgAP/gHwT/eiAE//MgBP/hHwL/cyAD//ggA//kHwP/byAE/+EfAP9zIAH/8B8D/3IgA//gHwH/biIA/+EfAP9xIAH/+B8B/24gA//gHwH/ciEA//cfAP9vIQD/9x8B/3IhAP/2HwH/biEA//YfAf9yIQD/9R8A/28hAP/0HwH/ciAA//QfAP9vIAD/8x8B/3IgAP/zHwH/biEA//MfAf9yIQD/8R8A/28hAP/wHwH/ciAA//AfAP9vIAD/7x8A/3EgAP/uHwH/byAA//cfAP9xIAD/7R8B/28gAP/sHwH/cSAA';
    const SOUND_SAVE_SRC = 'data:audio/wav;base64,UklGRlR2T19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBAdk9/yB3/KB//VR8C/1EgAv/LIAP/yR8B/24hAP/jHwL/bCEA//UfAv9tIQL/5B8C/2ohAv/fHwT/aiED/+sfBP9nIQb/1h8G/2YhCP/GIAo/xSAQPykXHz9rJj4/Sy9SP2pAZEBiTGlQZ1Z4V2xccl51YnNadsZ5fH6pfwh/e4B6hXyKeIt+kHx6fHt5e3J3cHRwb25tbWtta2ppaWdjYV9gXl1bV1RTUVFPUk9LTEpJS0dGR0VFR0JEQkFCQUA+PTw6Ojk3NjU1NDMyMTAwLy4tLCsqKSgnJiUkIyIhICAfHh0cHBsaGRgYFhUUExITEREOBwUEAwIB';
    const SOUND_GAME_OVER_SRC = 'data:audio/wav;base64,UklGRlR2T19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBAdk9/XjxqP1E6YEFDNmE+OzxZOWQ6YDxlP2Q8YkE4Yj02Wzo1WDlZOmE7YUA3Yj05XDs3VjpUOVU4VThUOFQ3UzdROlE6UDhQOFM4VThVOLZVOLVTN1M4UzhTOFM3VDhUN1M3UzhUOFM4VDhTOFQ5VDlVOLVTN1Q4UzhTNyxTNyxRNxUtUSxRLFAsUCwQLBAsECoQKhAqECgQKBAnECcQJhAmECYQJhAmECYQJhAmECYQJhAmECYQJhAmEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhA=';

    // --- GAME STATE ---
    let snake, food, bonusFood, direction, pendingDirection, score, level, speed, lives, isGameOver, isPaused, gameLoopTimeout, bonusFoodTimeout, bonusFoodSpawnTime;
    let speedIncreaseCounter = 0, currentFoodColorIndex = 0, highScores = [];
    let audio = { eatPool: [] };

    // --- DOM ELEMENTS ---
    let canvas, ctx, uiContainer, scoreDisplay, levelDisplay, livesDisplay, highScoresDisplay, overlay;
    let homeButton;

    // --- INITIALIZATION ---
    function init() { createDOM(); preloadAudio(); loadHighScores(); updateHighScoresDisplay(); showStartScreen(); setupEventListeners(); }
    function createDOM() {
        const gameContainer = document.createElement('div');
        gameContainer.style.position = 'relative'; gameContainer.style.display = 'flex'; gameContainer.style.flexDirection = 'column'; gameContainer.style.alignItems = 'center'; gameContainer.style.gap = '15px';
        container.appendChild(gameContainer);
        const topBar = document.createElement('div'); topBar.id = 'top-bar';
        homeButton = document.createElement('button'); homeButton.id = 'home-button'; homeButton.textContent = '← Menu';
        homeButton.onclick = () => { clearTimeout(gameLoopTimeout); window.location.reload(); };
        const logo = document.createElement('h1'); logo.id = 'logo'; logo.textContent = 'NEON SNAKE';
        topBar.append(homeButton, logo); gameContainer.appendChild(topBar);
        uiContainer = document.createElement('div'); uiContainer.id = 'ui-container';
        const scoreLabel = document.createElement('span'); scoreLabel.textContent = 'SCORE: '; scoreDisplay = document.createElement('span'); scoreDisplay.id = 'score';
        const levelLabel = document.createElement('span'); levelLabel.textContent = 'LEVEL: '; levelDisplay = document.createElement('span'); levelDisplay.id = 'level';
        livesDisplay = document.createElement('span'); livesDisplay.id = 'lives';
        uiContainer.append(scoreLabel, scoreDisplay, ' | ', levelLabel, levelDisplay, ' | ', livesDisplay); gameContainer.appendChild(uiContainer);
        canvas = document.createElement('canvas'); canvas.id = 'game-canvas'; canvas.width = CANVAS_SIZE; canvas.height = CANVAS_SIZE; ctx = canvas.getContext('2d'); gameContainer.appendChild(canvas);
        highScoresDisplay = document.createElement('div'); highScoresDisplay.id = 'high-scores'; gameContainer.appendChild(highScoresDisplay);
        const instructionsFooter = document.createElement('p'); instructionsFooter.id = 'instructions-footer'; instructionsFooter.innerHTML = 'Arrows to Move | Spacebar to Pause'; gameContainer.appendChild(instructionsFooter);
        overlay = document.createElement('div'); overlay.id = 'overlay'; gameContainer.appendChild(overlay);
        const style = document.createElement('style'); style.textContent = `
            :root { --border-color: ${BORDER_PULSE_COLORS[0]}; --border-pulse-duration: 4s; --border-pulse-intensity: 15px; }
            #top-bar { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }
            #home-button { position: absolute; left: 0; top: 50%; transform: translateY(-50%); font-family: 'VT323', monospace; font-size: 1.2em; padding: 5px 10px; background: transparent; color: #5c6e91; border: 1px solid #5c6e91; cursor: pointer; transition: all 0.2s; z-index: 10; }
            #home-button:hover { background: #5c6e91; color: #fff; }
            #logo { font-size: 4em; margin: 0; color: #fff; text-align: center; background: linear-gradient(to right, #f907fc, #2de2e6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 5px #f907fc, 0 0 15px #f907fc, 0 0 25px #2de2e6, 0 0 35px #2de2e6; }
            #ui-container { font-size: 2em; text-shadow: 0 0 5px #2de2e6, 0 0 10px #2de2e6; }
            #game-canvas { background-color: #000; border: 3px solid var(--border-color); animation: pulsate-border var(--border-pulse-duration) infinite ease-in-out; }
            @keyframes pulsate-border { 0% { box-shadow: 0 0 var(--border-pulse-intensity) var(--border-color), 0 0 25px var(--border-color) inset; } 50% { box-shadow: 0 0 calc(var(--border-pulse-intensity) * 1.5) var(--border-color), 0 0 35px var(--border-color) inset; } 100% { box-shadow: 0 0 var(--border-pulse-intensity) var(--border-color), 0 0 25px var(--border-color) inset; } }
            #high-scores { width: 200px; padding: 10px; border: 2px solid #2de2e6; box-shadow: 0 0 10px #2de2e6; text-align: center; }
            #high-scores h3 { margin: 0 0 10px; text-decoration: underline; color: #f907fc; } #high-scores ol { list-style-position: inside; padding: 0; margin: 0; text-align: left; } #high-scores li { padding: 2px 5px; }
            #instructions-footer { color: #5c6e91; font-size: 1.2em; letter-spacing: 1px; }
            #overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; visibility: hidden; opacity: 0; transition: opacity 0.3s, visibility 0.3s; z-index: 5; }
            #overlay.visible { visibility: visible; opacity: 1; }
            #overlay h2 { font-size: 3em; color: #f907fc; text-shadow: 0 0 10px #f907fc; }
            #overlay p, #overlay label { font-size: 1.5em; margin: 10px 0; }
            #overlay .button-group { display: flex; gap: 15px; margin-top: 20px;}
            #overlay button, #overlay select, #overlay input { font-family: 'VT323', monospace; font-size: 1.5em; padding: 10px 20px; background: rgba(0,0,0,0.5); color: #a6f2f2; border: 2px solid #a6f2f2; cursor: pointer; box-shadow: 0 0 8px #a6f2f2; transition: all 0.2s; }
            #overlay button:hover { background: #a6f2f2; color: #0d0221; }
        `;
        document.head.appendChild(style);
    }
    function preloadAudio() { for (let i = 0; i < EAT_SOUND_POOL_SIZE; i++) { audio.eatPool.push(new Audio(SOUND_EAT_SRC)); } audio.eatPoolIndex = 0; audio.save = new Audio(SOUND_SAVE_SRC); audio.gameOver = new Audio(SOUND_GAME_OVER_SRC); }
    function playSound(type) { if (type === 'eat') { const sound = audio.eatPool[audio.eatPoolIndex]; sound.currentTime = 0; sound.play(); audio.eatPoolIndex = (audio.eatPoolIndex + 1) % EAT_SOUND_POOL_SIZE; } else { const soundClone = audio[type].cloneNode(); soundClone.play(); } }
    function setupGame() {
        isGameOver = false; isPaused = false; score = 0; lives = 0; speedIncreaseCounter = 0; currentFoodColorIndex = 0;
        let levelSelect = document.getElementById('level-select'); level = levelSelect ? parseInt(levelSelect.value) : level;
        speed = 150 - (level * 10); snake = [{ x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2), color: SNAKE_DEFAULT_COLOR }]; direction = { x: 0, y: 0 }; pendingDirection = null; placeFood(); bonusFood = null; clearTimeout(gameLoopTimeout); canvas.style.setProperty('--border-color', BORDER_PULSE_COLORS[0]); canvas.style.setProperty('--border-pulse-duration', '4s');
        updateUI(); gameLoop();
    }
    function gameLoop() { if (isGameOver || isPaused) return; update(); draw(); gameLoopTimeout = setTimeout(gameLoop, speed); }
    function togglePause() { if (isGameOver) return; isPaused = !isPaused; if (isPaused) { clearTimeout(gameLoopTimeout); overlay.innerHTML = '<h2>PAUSED</h2>'; overlay.classList.add('visible'); } else { overlay.classList.remove('visible'); gameLoop(); } }
    function update() {
        if (pendingDirection) { direction = pendingDirection; pendingDirection = null; } if (direction.x === 0 && direction.y === 0) return; const currentHead = snake[0]; const newHead = { x: currentHead.x + direction.x, y: currentHead.y + direction.y, color: currentHead.color }; if (newHead.x < 0) newHead.x = TILE_COUNT - 1; else if (newHead.x >= TILE_COUNT) newHead.x = 0; if (newHead.y < 0) newHead.y = TILE_COUNT - 1; else if (newHead.y >= TILE_COUNT) newHead.y = 0; snake.unshift(newHead);
        if (newHead.x === food.x && newHead.y === food.y) {
            playSound('eat'); score += 1 * level; snake[0].color = food.color; placeFood(); checkSpeedIncrease();
            if (Math.random() < 0.1) placeBonusFood();
        } else if (bonusFood && newHead.x === bonusFood.x && newHead.y === bonusFood.y) {
            playSound('save'); lives++; const timeRemaining = BONUS_FOOD_DURATION - (Date.now() - bonusFoodSpawnTime); score += Math.max(1, Math.floor((timeRemaining / 1000) * level * 3)); snake[0].color = bonusFood.color; bonusFood = null; clearTimeout(bonusFoodTimeout); checkSpeedIncrease();
        } else { snake.pop(); }
        updateUI(); checkCollision();
    }
    function checkCollision() { const head = snake[0]; for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) { if (lives > 0) { lives--; playSound('save'); snake.splice(Math.max(1, snake.length - 3)); updateUI(); } else { gameOver(); } return; } } }
    function checkSpeedIncrease() { if (score > 0 && score % (5 * level) === 0 && score > speedIncreaseCounter * (5 * level)) { speedIncreaseCounter++; speed = Math.max(40, speed - 5); const newDuration = Math.max(1, 4 - speedIncreaseCounter * 0.5); const newColor = BORDER_PULSE_COLORS[speedIncreaseCounter % BORDER_PULSE_COLORS.length]; canvas.style.setProperty('--border-pulse-duration', `${newDuration}s`); canvas.style.setProperty('--border-color', newColor); } }
    function draw() { ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); drawSnake(); drawFood(); drawBonusFood(); }
    function drawSnake() { snake.forEach((segment, index) => { const isHead = index === 0; ctx.fillStyle = segment.color; ctx.shadowColor = segment.color; ctx.shadowBlur = isHead ? 15 : 10; ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2); }); ctx.shadowBlur = 0; }
    function drawFood() { ctx.fillStyle = food.color; ctx.shadowColor = food.color; ctx.shadowBlur = 15; ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE); ctx.shadowBlur = 0; }
    function drawBonusFood() { if (bonusFood) { const timeRemaining = Math.max(0, BONUS_FOOD_DURATION - (Date.now() - bonusFoodSpawnTime)); ctx.globalAlpha = timeRemaining / BONUS_FOOD_DURATION; const mapHeight = BONUS_ANIMAL_MAP.length; const mapWidth = BONUS_ANIMAL_MAP[0].length; const pixelSize = GRID_SIZE / Math.max(mapWidth, mapHeight); const pulse = Math.abs(Math.sin(Date.now() / 200)) * 0.2 + 0.9; const startX = bonusFood.x * GRID_SIZE; const startY = bonusFood.y * GRID_SIZE; ctx.fillStyle = bonusFood.color; ctx.shadowColor = bonusFood.color; ctx.shadowBlur = 20; for (let r = 0; r < mapHeight; r++) { for (let c = 0; c < mapWidth; c++) { if (BONUS_ANIMAL_MAP[r][c] === '1') { ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize * pulse, pixelSize * pulse); } } } ctx.shadowBlur = 0; ctx.globalAlpha = 1.0; ctx.fillStyle = '#FFF'; ctx.font = '16px VT323'; ctx.textAlign = 'center'; ctx.fillText((timeRemaining / 1000).toFixed(1), bonusFood.x * GRID_SIZE + GRID_SIZE / 2, bonusFood.y * GRID_SIZE - 5); } }
    function placeFood() { const color = REGULAR_FOOD_COLORS[currentFoodColorIndex]; food = { ...getRandomPosition(), color: color }; currentFoodColorIndex = (currentFoodColorIndex + 1) % REGULAR_FOOD_COLORS.length; }
    function placeBonusFood() { if (bonusFood) return; bonusFood = { ...getRandomPosition(), color: BONUS_FOOD_COLOR }; bonusFoodSpawnTime = Date.now(); clearTimeout(bonusFoodTimeout); bonusFoodTimeout = setTimeout(() => { bonusFood = null; }, BONUS_FOOD_DURATION); }
    function getRandomPosition() { let position; do { position = { x: Math.floor(Math.random() * TILE_COUNT), y: Math.floor(Math.random() * TILE_COUNT) }; } while (isPositionOnSnake(position)); return position; }
    function isPositionOnSnake(position) { return snake.some(segment => segment.x === position.x && segment.y === position.y); }
    function updateUI() { scoreDisplay.textContent = score; levelDisplay.textContent = level; livesDisplay.innerHTML = '♥ ' + lives; }
    function showStartScreen() { overlay.innerHTML = ''; let overlayMessage = document.createElement('h2'); overlayMessage.textContent = 'NEON SNAKE'; const instructions = document.createElement('p'); instructions.textContent = 'Use Arrow Keys to Move'; const levelLabel = document.createElement('label'); levelLabel.textContent = 'Select Level: '; let levelSelect = document.createElement('select'); levelSelect.id = 'level-select'; for(let i = 1; i <= 9; i++) { const option = document.createElement('option'); option.value = i; option.textContent = i; levelSelect.appendChild(option); } levelLabel.appendChild(levelSelect); let startButton = document.createElement('button'); startButton.textContent = 'Start Game'; startButton.onclick = () => { overlay.classList.remove('visible'); setupGame(); }; overlay.append(overlayMessage, instructions, levelLabel, startButton); overlay.classList.add('visible'); }
    function gameOver() { isGameOver = true; clearTimeout(gameLoopTimeout); clearTimeout(bonusFoodTimeout); playSound('gameOver'); setTimeout(() => { const isHighScore = checkIfHighScore(score); overlay.innerHTML = ''; let overlayMessage = document.createElement('h2'); overlayMessage.textContent = 'GAME OVER'; const finalScore = document.createElement('p'); finalScore.textContent = `Your Score: ${score}`; overlay.append(overlayMessage, finalScore); if (isHighScore) { const namePrompt = document.createElement('p'); namePrompt.textContent = 'New High Score! Enter your name:'; const nameInput = document.createElement('input'); nameInput.id = 'name-input'; nameInput.type = 'text'; nameInput.maxLength = 10; const submitButton = document.createElement('button'); submitButton.textContent = 'Save'; submitButton.onclick = () => { const name = nameInput.value.trim() || 'Player'; addHighScore(name, score); saveHighScores(); updateHighScoresDisplay(); showStartScreen(); }; overlay.append(namePrompt, nameInput, submitButton); } else { const buttonGroup = document.createElement('div'); buttonGroup.className = 'button-group'; const retryButton = document.createElement('button'); retryButton.textContent = 'Retry'; retryButton.onclick = () => { overlay.classList.remove('visible'); setupGame(); }; const playAgainButton = document.createElement('button'); playAgainButton.textContent = 'Main Menu'; playAgainButton.onclick = showStartScreen; buttonGroup.append(retryButton, playAgainButton); overlay.appendChild(buttonGroup); } overlay.classList.add('visible'); }, 500); }
    function loadHighScores() { const scores = localStorage.getItem('neonSnakeHighScores'); highScores = scores ? JSON.parse(scores) : []; }
    function saveHighScores() { localStorage.setItem('neonSnakeHighScores', JSON.stringify(highScores)); }
    function checkIfHighScore(newScore) { if (newScore === 0) return false; const lowestScore = highScores.length < 10 ? 0 : highScores[9].score; return newScore > lowestScore; }
    function addHighScore(name, score) { highScores.push({ name, score }); highScores.sort((a, b) => b.score - a.score); highScores = highScores.slice(0, 10); }
    function updateHighScoresDisplay() { highScoresDisplay.innerHTML = '<h3>High Scores</h3>'; const list = document.createElement('ol'); if (highScores.length === 0) { list.innerHTML = '<li>No scores yet!</li>'; } else { highScores.forEach(entry => { const item = document.createElement('li'); item.textContent = `${entry.name}: ${entry.score}`; list.appendChild(item); }); } highScoresDisplay.appendChild(list); }
    function setupEventListeners() { document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); togglePause(); return; } if (isGameOver || isPaused) return; switch (e.key) { case 'ArrowUp': if (direction.y === 0) pendingDirection = { x: 0, y: -1 }; break; case 'ArrowDown': if (direction.y === 0) pendingDirection = { x: 0, y: 1 }; break; case 'ArrowLeft': if (direction.x === 0) pendingDirection = { x: -1, y: 0 }; break; case 'ArrowRight': if (direction.x === 0) pendingDirection = { x: 1, y: 0 }; break; } }); }
    init();
}
