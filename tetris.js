function loadTetrisGame(container) {
    // --- CONSTANTS & CONFIG ---
    const COLS = 10, ROWS = 20, BLOCK_SIZE = 30;
    const COLORS = ['#f907fc', '#fc3a07', '#f4f40a', '#0af40a', '#0af4f4', '#2de2e6', '#8A2BE2'];
    const BORDER_PULSE_COLORS = ['#f907fc', '#fc3a07', '#f4f40a', '#0af40a', '#0af4f4', '#2de2e6', '#f907fc'];
    const SHAPES = [
        [[1,1,1,1]], // I
        [[1,1,0],[0,1,1]], // S
        [[0,1,1],[1,1,0]], // Z
        [[1,1,1],[0,1,0]], // T
        [[1,1,1],[1,0,0]], // L
        [[1,1,1],[0,0,1]], // J
        [[1,1],[1,1]]  // O
    ];
    // --- AUDIO ---
    const SOUND_CLEAR_SRC = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU0AAAAAAAA/D4H/fh8B/3UgBv/lIRf/qyAX/8IgDf/PIAz/0B8C/zEhBP/aHwP/eyEE//QgCP/LIAn/xR8B/3MgAP/gHwT/eiAE//MgBP/hHwL/cyAD//ggA//kHwP/byAE/+EfAP9zIAH/8B8D/3IgA//gHwH/biIA/+EfAP9xIAH/+B8B/24gA//gHwH/ciEA//cfAP9vIQD/9x8B/3IhAP/2HwH/biEA//YfAf9yIQD/9R8A/28hAP/0HwH/ciAA//QfAP9vIAD/8x8B/3IgAP/zHwH/biEA//MfAf9yIQD/8R8A/28hAP/wHwH/ciAA//AfAP9vIAD/7x8A/3EgAP/uHwH/byAA//cfAP9xIAD/7R8B/28gAP/sHwH/cSAA';
    const SOUND_LEVELUP_SRC = 'data:audio/wav;base64,UklGRlR2T19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBAdk9/yB3/KB//VR8C/1EgAv/LIAP/yR8B/24hAP/jHwL/bCEA//UfAv9tIQL/5B8C/2ohAv/fHwT/aiED/+sfBP9nIQb/1h8G/2YhCP/GIAo/xSAQPykXHz9rJj4/Sy9SP2pAZEBiTGlQZ1Z4V2xccl51YnNadsZ5fH6pfwh/e4B6hXyKeIt+kHx6fHt5e3J3cHRwb25tbWtta2ppaWdjYV9gXl1bV1RTUVFPUk9LTEpJS0dGR0VFR0JEQkFCQUA+PTw6Ojk3NjU1NDMyMTAwLy4tLCsqKSgnJiUkIyIhICAfHh0cHBsaGRgYFhUUExITEREOBwUEAwIB';
    const SOUND_GAMEOVER_SRC = 'data:audio/wav;base64,UklGRlR2T19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBAdk9/XjxqP1E6YEFDNmE+OzxZOWQ6YDxlP2Q8YkE4Yj02Wzo1WDlZOmE7YUA3Yj05XDs3VjpUOVU4VThUOFQ3UzdROlE6UDhQOFM4VThVOLZVOLVTN1M4UzhTOFM3VDhUN1M3UzhUOFM4VDhTOFQ5VDlVOLVTN1Q4UzhTNyxTNyxRNxUtUSxRLFAsUCwQLBAsECoQKhAqECgQKBAnECcQJhAmECYQJhAmECYQJhAmECYQJhAmECYQJhAmEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhAGEAYQBhA=';

    // --- GAME STATE ---
    let canvas, ctx, board, currentPiece, nextPiece, score, lines, level, dropStart, isGameOver, isPaused, gameLoopId;
    let audio = {}; let highScores = [];

    // --- INITIALIZATION ---
    function init() { createDOM(); preloadAudio(); resetGame(); setupEventListeners(); gameLoop(); }
    function createDOM() {
        const gameLayout = document.createElement('div');
        gameLayout.style.display = 'flex'; gameLayout.style.alignItems = 'flex-start'; gameLayout.style.gap = '20px';
        container.appendChild(gameLayout);
        const mainArea = document.createElement('div');
        mainArea.style.display = 'flex'; mainArea.style.flexDirection = 'column'; mainArea.style.alignItems = 'center'; mainArea.style.gap = '15px';
        gameLayout.appendChild(mainArea);
        const topBar = document.createElement('div'); topBar.id = 'top-bar';
        const homeButton = document.createElement('button'); homeButton.id = 'home-button'; homeButton.textContent = '← Menu';
        homeButton.onclick = () => { cancelAnimationFrame(gameLoopId); window.location.reload(); };
        const logo = document.createElement('h1'); logo.id = 'logo'; logo.textContent = 'NEON TETRIS';
        topBar.append(homeButton, logo); mainArea.appendChild(topBar);
        canvas = document.createElement('canvas'); canvas.id = 'game-canvas';
        canvas.width = COLS * BLOCK_SIZE; canvas.height = ROWS * BLOCK_SIZE; ctx = canvas.getContext('2d'); mainArea.appendChild(canvas);
        const instructionsFooter = document.createElement('p'); instructionsFooter.id = 'instructions-footer'; instructionsFooter.innerHTML = 'Arrows: Move/Rotate | Space: Hard Drop | P: Pause'; mainArea.appendChild(instructionsFooter);
        const sidePanel = document.createElement('div'); sidePanel.id = 'side-panel'; gameLayout.appendChild(sidePanel);
        const style = document.createElement('style'); style.textContent = `
            :root { --border-color: ${BORDER_PULSE_COLORS[0]}; --border-pulse-duration: 4s; }
            #top-bar { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }
            #home-button { position: absolute; left: 0; top: 50%; transform: translateY(-50%); font-family: 'VT323', monospace; font-size: 1.2em; padding: 5px 10px; background: transparent; color: #5c6e91; border: 1px solid #5c6e91; cursor: pointer; transition: all 0.2s; }
            #home-button:hover { background: #5c6e91; color: #fff; }
            #logo { font-size: 3em; margin: 0; color: #fff; text-align: center; background: linear-gradient(to right, #f907fc, #2de2e6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 5px #f907fc, 0 0 15px #f907fc, 0 0 25px #2de2e6, 0 0 35px #2de2e6; }
            #game-canvas { background-color: #000; border: 3px solid var(--border-color); animation: pulsate-border var(--border-pulse-duration) infinite ease-in-out; }
            @keyframes pulsate-border { 0% { box-shadow: 0 0 15px var(--border-color), 0 0 25px var(--border-color) inset; } 50% { box-shadow: 0 0 22px var(--border-color), 0 0 35px var(--border-color) inset; } 100% { box-shadow: 0 0 15px var(--border-color), 0 0 25px var(--border-color) inset; } }
            #instructions-footer { color: #5c6e91; font-size: 1.2em; letter-spacing: 1px; }
            #side-panel { display: flex; flex-direction: column; gap: 20px; width: 200px; text-align: center; font-size: 1.5em; }
            .info-box { padding: 10px; border: 2px solid #2de2e6; box-shadow: 0 0 10px #2de2e6; }
            .info-box h3 { margin: 0 0 10px; color: #f907fc; text-decoration: underline; }
            #next-piece-canvas { background: #000; }
            #high-scores ol { list-style-position: inside; padding: 0; margin: 0; text-align: left; font-size: 0.9em; }
            #high-scores li { padding: 2px 5px; }
            #game-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; visibility: hidden; opacity: 0; transition: opacity 0.3s; }
            #game-overlay.visible { visibility: visible; opacity: 1; }
            #game-overlay h2 { font-size: 3em; color: #f907fc; text-shadow: 0 0 10px #f907fc; }
        `;
        document.head.appendChild(style);
        sidePanel.innerHTML = `<div class="info-box"><h3>SCORE</h3><p id="score">0</p></div> <div class="info-box"><h3>LINES</h3><p id="lines">0</p></div> <div class="info-box"><h3>LEVEL</h3><p id="level">1</p></div> <div class="info-box"><h3>NEXT</h3><canvas id="next-piece-canvas" width="120" height="120"></canvas></div> <div id="high-scores" class="info-box"></div>`;
        const overlay = document.createElement('div'); overlay.id = 'game-overlay'; mainArea.appendChild(overlay);
        loadHighScores(); updateHighScoresDisplay();
    }
    function preloadAudio() { audio.clear = new Audio(SOUND_CLEAR_SRC); audio.levelUp = new Audio(SOUND_LEVELUP_SRC); audio.gameOver = new Audio(SOUND_GAMEOVER_SRC); }
    function playSound(type) { const sound = audio[type].cloneNode(); sound.play(); }

    function resetGame() { board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); score = 0; lines = 0; level = 1; isGameOver = false; isPaused = false; currentPiece = newPiece(); nextPiece = newPiece(); dropStart = Date.now(); updateUI(); changeBorderColor(); }
    function newPiece() { const id = Math.floor(Math.random() * SHAPES.length); return { shape: SHAPES[id], color: COLORS[id], x: Math.floor(COLS / 2) - 1, y: 0 }; }
    function gameLoop() {
        if (isGameOver || isPaused) return;
        const now = Date.now();
        if (now - dropStart > Math.max(50, 1000 - (level * 75))) { drop(); }
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    function drop() { if (!isValidMove(0, 1, currentPiece.shape)) { lockPiece(); return; } currentPiece.y++; dropStart = Date.now(); }
    function hardDrop() { while (isValidMove(0, 1, currentPiece.shape)) { currentPiece.y++; } lockPiece(); }
    function rotate() { let newShape = currentPiece.shape[0].map((_, i) => currentPiece.shape.map(row => row[i]).reverse()); const kicks = [0, 1, -1, 2, -2]; for (const k of kicks) { if (isValidMove(k, 0, newShape)) { currentPiece.x += k; currentPiece.shape = newShape; return; } } }
    function move(dx) { if (isValidMove(dx, 0, currentPiece.shape)) { currentPiece.x += dx; } }
    
    function isValidMove(dx, dy, shape) {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    let newX = currentPiece.x + x + dx; let newY = currentPiece.y + y + dy;
                    if (newX < 0 || newX >= COLS || newY >= ROWS) { return false; }
                    if (newY >= 0 && board[newY] && board[newY][newX]) { return false; }
                }
            }
        }
        return true;
    }

    function lockPiece() {
        currentPiece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value) { board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color; } }); });
        clearLines();
        currentPiece = nextPiece; nextPiece = newPiece();
        // --- GAME OVER CHECK ---
        if (!isValidMove(0, 0, currentPiece.shape)) { gameOver(); }
    }
    function clearLines() {
        let linesCleared = 0; const oldLevel = level;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r].every(cell => cell !== 0)) { linesCleared++; board.splice(r, 1); board.unshift(Array(COLS).fill(0)); r++; playSound('clear'); }
        }
        if (linesCleared > 0) {
            score += [0, 40, 100, 300, 1200][linesCleared] * level; lines += linesCleared;
            level = Math.floor(lines / 10) + 1;
            if (level > oldLevel) { playSound('levelUp'); changeBorderColor(); }
            updateUI();
        }
    }
    function gameOver() { isGameOver = true; cancelAnimationFrame(gameLoopId); playSound('gameOver'); checkIfHighScore(score); document.getElementById('game-overlay').innerHTML = '<h2>GAME OVER</h2>'; document.getElementById('game-overlay').classList.add('visible'); }
    function draw() { ctx.clearRect(0, 0, canvas.width, canvas.height); drawBoard(); drawPiece(currentPiece); drawNextPiece(); }
    function drawBoard() { board.forEach((row, y) => row.forEach((color, x) => { if(color) drawBlock(x, y, color, ctx); })); }
    function drawPiece(piece) { piece.shape.forEach((row, y) => row.forEach((value, x) => { if(value) drawBlock(piece.x + x, piece.y + y, piece.color, ctx); })); }
    function drawNextPiece() { const nextCtx = document.getElementById('next-piece-canvas').getContext('2d'); nextCtx.clearRect(0,0,120,120); const offsetX = (4 - nextPiece.shape[0].length) / 2; const offsetY = (4 - nextPiece.shape.length) / 2; nextPiece.shape.forEach((row, y) => row.forEach((value, x) => { if(value) drawBlock(x + offsetX, y + offsetY, nextPiece.color, nextCtx); })); }
    function drawBlock(x, y, color, context) { if (y < 0) return; context.fillStyle = color; context.shadowColor = color; context.shadowBlur = 10; context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); context.strokeStyle = '#000'; context.lineWidth = 2; context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); context.shadowBlur = 0; }
    function changeBorderColor() { const newColor = BORDER_PULSE_COLORS[(level - 1) % BORDER_PULSE_COLORS.length]; canvas.style.setProperty('--border-color', newColor); const newDuration = Math.max(1, 4 - Math.floor(level / 2) * 0.5); canvas.style.setProperty('--border-pulse-duration', `${newDuration}s`); }
    function updateUI() { document.getElementById('score').textContent = score; document.getElementById('lines').textContent = lines; document.getElementById('level').textContent = level; }
    function loadHighScores() { highScores = JSON.parse(localStorage.getItem('neonTetrisHighScores')) || []; }
    function saveHighScores() { localStorage.setItem('neonTetrisHighScores', JSON.stringify(highScores)); }
    function checkIfHighScore(newScore) { if (newScore === 0) return; const lowestScore = highScores.length < 10 ? 0 : highScores[9].score; if(newScore > lowestScore) { const name = prompt('New High Score! Enter your name:', 'Player'); addHighScore(name || 'Player', newScore); saveHighScores(); updateHighScoresDisplay(); } }
    function addHighScore(name, score) { highScores.push({ name, score }); highScores.sort((a, b) => b.score - a.score); highScores = highScores.slice(0, 10); }
    function updateHighScoresDisplay() { const hsList = document.getElementById('high-scores'); hsList.innerHTML = '<h3>High Scores</h3>'; const list = document.createElement('ol'); if (highScores.length === 0) { list.innerHTML = '<li>No scores yet!</li>'; } else { highScores.forEach(entry => { const item = document.createElement('li'); item.textContent = `${entry.name}: ${entry.score}`; list.appendChild(item); }); } hsList.appendChild(list); }
    function setupEventListeners() { document.addEventListener('keydown', e => { if (isGameOver) return; if (e.key === 'p' || e.key === 'P') { isPaused = !isPaused; document.getElementById('game-overlay').innerHTML = isPaused ? '<h2>PAUSED</h2>' : ''; document.getElementById('game-overlay').classList.toggle('visible', isPaused); if(!isPaused) gameLoop(); return; } if (isPaused) return; switch(e.key) { case 'ArrowLeft': move(-1); break; case 'ArrowRight': move(1); break; case 'ArrowDown': drop(); break; case 'ArrowUp': rotate(); break; case ' ': e.preventDefault(); hardDrop(); break; } }); }
    init();
}
