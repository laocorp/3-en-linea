// public/script.js - VERSIÓN FINAL Y PULIDA

// --- OBJETOS DE AUDIO ---
// Se definen al inicio. Usamos rutas absolutas para mayor fiabilidad.
const soundMove = new Audio('/sounds/move.mp3');
const soundWin = new Audio('/sounds/win.mp3');
const soundDraw = new Audio('/sounds/draw.mp3');

// --- SELECTORES DEL DOM ---
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const gameSection = document.getElementById('game-section');
const playerXScoreElement = document.getElementById('player-x-score');
const playerOScoreElement = document.getElementById('player-o-score');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');

// --- ESTADO DEL CLIENTE ---
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
let mySymbol = null;
let currentBoardSize = 0;
let isGameActive = false;
let audioUnlocked = false; // Para controlar si el audio ya fue inicializado
let lastMoveCount = 0;
let cells = [];

// --- FUNCIONES DE LA INTERFAZ ---

/**
 * Desbloquea el audio después de la primera interacción del usuario para cumplir
 * con las políticas de autoplay de los navegadores.
 */
function unlockAudio() {
    if (audioUnlocked) return;
    // Un truco común: intenta reproducir y pausar cada sonido.
    soundMove.play().catch(() => {});
    soundMove.pause();
    soundWin.play().catch(() => {});
    soundWin.pause();
    soundDraw.play().catch(() => {});
    soundDraw.pause();
    audioUnlocked = true;
    console.log("Contexto de audio desbloqueado.");
}

function showJoinModal() {
    const joinHTML = `
        <h1 class="text-4xl font-bold text-center bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">Tic-Tac-Toe</h1>
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
        <button id="join-button" class="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-violet-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar</button>
    `;
    modalContent.innerHTML = joinHTML;
    modal.classList.remove('opacity-0', 'pointer-events-none');

    const joinButton = document.getElementById('join-button');
    joinButton.addEventListener('click', () => {
        unlockAudio(); // Se llama aquí, en la primera interacción del usuario.
        const nameInput = document.getElementById('name-input');
        const name = nameInput.value;
        if (!name) { alert('Por favor, escribe tu nombre.'); return; }
        const size = document.querySelector('input[name="boardSize"]:checked').value;
        sendMessage('join', { name, size: parseInt(size) });
    });
}

function showGameOverModal(winnerSymbol, gameState) {
    // Se envuelve toda la lógica en un setTimeout para dar tiempo a la animación.
    setTimeout(() => {
        let title, body;
        if (winnerSymbol === 'draw') {
            title = "¡Es un Empate!";
            body = "Buena partida. ¿Listos para la revancha?";
            soundDraw.play().catch(e => console.error("Error al reproducir sonido:", e));
        } else {
            const winnerName = gameState.playersInfo[winnerSymbol].name;
            title = "¡Tenemos un Ganador!";
            body = `Felicidades, <span class="font-bold text-white">${winnerName}</span>. ¡Has ganado la partida!`;
            soundWin.play().catch(e => console.error("Error al reproducir sonido:", e));
        }
        
        const gameOverHTML = `
            <h2 class="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">${title}</h2>
            <p class="text-xl text-gray-300">${body}</p>
            <button id="reset-button" class="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-violet-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar de Nuevo</button>
        `;
        modalContent.innerHTML = gameOverHTML;
        modal.classList.remove('opacity-0', 'pointer-events-none');
        
        const resetButton = document.getElementById('reset-button');
        resetButton.addEventListener('click', () => {
            hideModal();
            sendMessage('reset');
        });
    }, 1000); // 1 segundo de retraso
}

function hideModal() {
    modal.classList.add('opacity-0', 'pointer-events-none');
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

function renderBoard(board) {
    board.forEach((value, index) => {
        if (cells[index]) {
            const icon = value === 'X' ? ICON_X : (value === 'O' ? ICON_O : '');
            if (cells[index].innerHTML === '' && icon !== '') {
                cells[index].innerHTML = icon;
            } else if (icon === '') {
                cells[index].innerHTML = '';
            }
        }
    });
}

function updateUI(gameState) {
    if (!gameState) return;
    gameSection.classList.remove('opacity-0');
    isGameActive = gameState.gameActive;
    createBoard(gameState.size);
    renderBoard(gameState.board);
    
    const playerXName = gameState.playersInfo.X.name || 'Jugador X';
    const playerOName = gameState.playersInfo.O.name || 'Jugador O';
    playerXScoreElement.querySelector('.player-name').textContent = playerXName;
    playerOScoreElement.querySelector('.player-name').textContent = playerOName;
    playerXScoreElement.querySelector('.score').textContent = gameState.scores.X;
    playerOScoreElement.querySelector('.score').textContent = gameState.scores.O;

    const { playersInfo, currentPlayer, gameActive } = gameState;
    if (gameActive) {
        if (!playersInfo.X.connected || !playersInfo.O.connected) {
            statusElement.textContent = "Esperando que el oponente se reconecte...";
            isGameActive = false;
        } else if (mySymbol === currentPlayer) {
            statusElement.textContent = "Es tu turno";
        } else {
            statusElement.textContent = `Turno de ${playersInfo[currentPlayer].name}`;
        }
    }
}

function sendMessage(type, payload) {
    ws.send(JSON.stringify({ type, payload }));
}

ws.onopen = () => {
    console.log("Conectado al servidor.");
    const playerId = sessionStorage.getItem('playerId');
    if (playerId) {
        sendMessage('reconnect', { playerId });
    } else {
        showJoinModal();
    }
};

ws.onmessage = (event) => {
    try {
        const { type, payload } = JSON.parse(event.data);

        switch (type) {
            case 'assignIdentity':
                mySymbol = payload.symbol;
                sessionStorage.setItem('playerId', payload.playerId);
                hideModal();
                break;
            case 'update':
                hideModal();
                const moveCount = payload.gameState.board.filter(Boolean).length;
                if (moveCount > 0 && moveCount !== lastMoveCount) {
                    soundMove.play().catch(e => console.error("Error al reproducir sonido de movimiento:", e));
                }
                lastMoveCount = moveCount;
                updateUI(payload.gameState);
                break;
            case 'gameOver':
                isGameActive = false;
                lastMoveCount = 0;
                updateUI(payload.gameState);
                showGameOverModal(payload.winnerSymbol, payload.gameState);
                break;
            case 'opponentDisconnected':
                updateUI(payload.gameState);
                break;
            case 'gameEnded':
                alert(payload.message);
                sessionStorage.removeItem('playerId');
                window.location.reload();
                break;
            case 'error':
                alert(`Error: ${payload.message}`);
                sessionStorage.removeItem('playerId');
                window.location.reload();
                break;
        }
    } catch (error) {
        console.error("Error al procesar el mensaje del servidor:", error);
    }
};

const ICON_X = `<svg class="w-3/4 h-3/4 text-cyan-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_O = `<svg class="w-3/4 h-3/4 text-amber-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;