// public/script.js - VERSIÓN FINAL
const soundMove = new Audio('/sounds/move.mp3');
const soundWin = new Audio('/sounds/win.mp3');
const soundDraw = new Audio('/sounds/draw.mp3');

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const gameSection = document.getElementById('game-section');
const playerXScoreElement = document.getElementById('player-x-score');
const playerOScoreElement = document.getElementById('player-o-score');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
let cells = [];

const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
let mySymbol = null;
let currentBoardSize = 0;
let isGameActive = false;
let audioUnlocked = false;
let lastMoveCount = 0;

function unlockAudio() {
    if (audioUnlocked) return;
    soundMove.play().catch(() => {}); soundMove.pause();
    soundWin.play().catch(() => {}); soundWin.pause();
    soundDraw.play().catch(() => {}); soundDraw.pause();
    audioUnlocked = true;
    console.log("Contexto de audio desbloqueado.");
}

function showModal(content) {
    modalContent.innerHTML = content;
    modal.classList.remove('opacity-0', 'pointer-events-none');
}

function hideModal() {
    modal.classList.add('opacity-0', 'pointer-events-none');
}

function showJoinModal() {
    const joinHTML = `
        <h1 class="text-4xl font-bold text-center bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">3 EN RAYA</h1>
        <input type="text" id="name-input" placeholder="Escribe tu nombre" maxlength="12" class="bg-gray-900/70 border border-gray-700 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-violet-500 transition">
        <div>
            <h2 class="text-lg font-semibold text-center text-gray-400 mb-3">Elige el tamaño</h2>
            <div class="grid grid-cols-4 gap-2 text-sm text-gray-300">
                <div><input type="radio" id="size3" name="boardSize" value="3" class="hidden peer" checked><label for="size3" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">3x3</label></div>
                <div><input type="radio" id="size4" name="boardSize" value="4" class="hidden peer"><label for="size4" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">4x4</label></div>
                <div><input type="radio" id="size5" name="boardSize" value="5" class="hidden peer"><label for="size5" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">5x5</label></div>
                <div><input type="radio" id="size6" name="boardSize" value="6" class="hidden peer"><label for="size6" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">6x6</label></div>
            </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-4">
            <button id="join-ai-button" class="w-full bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar contra IA</button>
            <button id="join-friend-button" class="w-full bg-violet-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-violet-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar con Amigo</button>
        </div>
    `;
    showModal(joinHTML);

    document.getElementById('join-ai-button').addEventListener('click', () => {
        unlockAudio();
        const name = document.getElementById('name-input').value;
        if (!name) { alert('Por favor, escribe tu nombre.'); return; }
        const size = document.querySelector('input[name="boardSize"]:checked').value;
        sendMessage('startGameAI', { name, size: parseInt(size) });
    });

    document.getElementById('join-friend-button').addEventListener('click', () => {
        unlockAudio();
        const name = document.getElementById('name-input').value;
        if (!name) { alert('Por favor, escribe tu nombre.'); return; }
        const size = document.querySelector('input[name="boardSize"]:checked').value;
        sendMessage('join', { name, size: parseInt(size) });
        modalContent.innerHTML = `<h2 class="text-2xl font-bold text-slate-200 animate-pulse">Esperando a un amigo...</h2><p class="text-slate-400">Comparte la URL de esta página para que se una.</p>`;
    });
}

function showGameOverModal(winnerSymbol, gameState) {
    setTimeout(() => {
        let title, body;
        if (winnerSymbol === 'draw') {
            title = "¡Es un Empate!"; body = "Buena partida. ¿Listos para la revancha?";
            soundDraw.play().catch(e => console.error("Error al reproducir sonido:", e));
        } else {
            const winnerName = gameState.playersInfo[winnerSymbol].name;
            title = "¡Tenemos un Ganador!"; body = `Felicidades, <span class="font-bold text-white">${winnerName}</span>. ¡Has ganado la partida!`;
            soundWin.play().catch(e => console.error("Error al reproducir sonido:", e));
        }
        
        const gameOverHTML = `
            <h2 class="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">${title}</h2>
            <p class="text-xl text-gray-300">${body}</p>
            <button id="reset-button" class="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-violet-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar de Nuevo</button>
        `;
        showModal(gameOverHTML);

        document.getElementById('reset-button').addEventListener('click', () => {
            hideModal();
            sendMessage('reset');
        });
    }, 1000);
}

function createBoard(size) {
    if (currentBoardSize === size && cells.length > 0) return;
    currentBoardSize = size;
    boardElement.innerHTML = '';
    cells = [];
    boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.classList.add('bg-gray-800/50', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'font-bold', 'hover:bg-gray-700/50', 'cursor-pointer', 'transition-all', 'duration-200', 'border', 'border-gray-700/50');
        cells.push(cell);
        boardElement.appendChild(cell);
    }
    setupCellListeners();
}

function setupCellListeners() {
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            if (isGameActive && cell.innerHTML === '') sendMessage('move', { index });
        });
    });
}

function renderBoard(board, lastMoveIndex) {
    const prevLastMove = document.querySelector('.last-move');
    if (prevLastMove) prevLastMove.classList.remove('last-move');
    
    board.forEach((value, index) => {
        if(cells[index]) {
            const icon = value === 'X' ? ICON_X : (value === 'O' ? ICON_O : '');
            if (cells[index].innerHTML === '' && icon !== '') cells[index].innerHTML = icon;
            else if (icon === '') cells[index].innerHTML = '';
        }
    });

    if (lastMoveIndex !== null && cells[lastMoveIndex]) {
        cells[lastMoveIndex].classList.add('last-move');
    }
}

function updateUI(gameState) {
    if (!gameState) return;
    gameSection.classList.remove('opacity-0');
    isGameActive = gameState.gameActive;
    createBoard(gameState.size);
    renderBoard(gameState.board, gameState.lastMoveIndex);
    
    const playerXName = gameState.playersInfo.X.name || 'Jugador X';
    const playerOName = gameState.playersInfo.O.name || 'Jugador O';
    playerXScoreElement.querySelector('.player-name').textContent = playerXName;
    playerOScoreElement.querySelector('.player-name').textContent = playerOName;
    playerXScoreElement.querySelector('.score').textContent = gameState.scores.X;
    playerOScoreElement.querySelector('.score').textContent = gameState.scores.O;

    const { playersInfo, currentPlayer, gameActive } = gameState;
    const turnIndicatorElement = document.querySelector('.turn-active');
    if (turnIndicatorElement) turnIndicatorElement.classList.remove('turn-active');
    if (gameActive) {
        if (currentPlayer === 'X') playerXScoreElement.classList.add('turn-active');
        else playerOScoreElement.classList.add('turn-active');
    }

    if (gameActive) {
        if (!playersInfo.X.name || (!playersInfo.O.name && !gameState.isAIGame)) {
            statusElement.innerHTML = "Esperando oponente...";
        } else if (mySymbol === currentPlayer) {
            statusElement.innerHTML = "Es tu turno";
        } else {
            statusElement.innerHTML = `Turno de ${playersInfo[currentPlayer].name}<span class="thinking-dots"></span>`;
        }
    }
}

function sendMessage(type, payload) {
    ws.send(JSON.stringify({ type, payload }));
}

ws.onopen = () => {
    console.log("Conectado al servidor.");
    showJoinModal();
};

ws.onmessage = (event) => {
    try {
        const { type, payload } = JSON.parse(event.data);

        switch (type) {
            case 'assignSymbol':
                mySymbol = payload.symbol;
                hideModal();
                break;
            case 'update':
                hideModal();
                const moveCount = payload.gameState.board.filter(Boolean).length;
                if (moveCount > lastMoveCount) {
                    soundMove.play().catch(e => console.error("Error al reproducir sonido:", e));
                }
                lastMoveCount = moveCount;
                if(moveCount === 0) lastMoveCount = 0;
                updateUI(payload.gameState);
                break;
            case 'gameOver':
                isGameActive = false;
                lastMoveCount = 0;
                updateUI(payload.gameState);
                showGameOverModal(payload.winnerSymbol, payload.gameState);
                break;
            case 'opponentLeft':
                alert("Tu oponente se ha desconectado.");
                window.location.reload();
                break;
            case 'error':
                alert(`Error: ${payload.message}`);
                window.location.reload();
                break;
        }
    } catch (error) {
        console.error("Error al procesar el mensaje del servidor:", error);
    }
};

const ICON_X = `<svg class="w-3/4 h-3/4 text-cyan-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_O = `<svg class="w-3/4 h-3/4 text-amber-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;