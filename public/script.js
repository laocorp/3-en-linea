// public/script.js - VERSIÓN FINAL CON REINICIO SINCRONIZADO

// --- ELEMENTOS DEL DOM ---
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const playerXScoreElement = document.getElementById('player-x-score');
const playerOScoreElement = document.getElementById('player-o-score');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
let cells = [];

// --- ESTADO DEL CLIENTE ---
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
let mySymbol = null;
let currentBoardSize = 0;
let isGameActive = false;

// --- FUNCIONES DE LA INTERFAZ ---

/**
 * Muestra el modal de inicio para que el jugador ingrese su nombre y elija el tamaño.
 */
function showJoinModal() {
    modalContent.innerHTML = `
        <h1 class="text-4xl font-bold text-center bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">Tic-Tac-Toe</h1>
        <input type="text" id="name-input" placeholder="Escribe tu nombre" maxlength="12" class="bg-gray-900/70 border border-gray-700 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-violet-500 transition">
        <div>
            <h2 class="text-lg font-semibold text-center text-gray-400 mb-3">Elige el tamaño</h2>
            <div class="grid grid-cols-4 gap-2 text-sm">
                <div>
                    <input type="radio" id="size3" name="boardSize" value="3" class="hidden peer" checked>
                    <label for="size3" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">3x3</label>
                </div>
                <div>
                    <input type="radio" id="size4" name="boardSize" value="4" class="hidden peer">
                    <label for="size4" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">4x4</label>
                </div>
                <div>
                    <input type="radio" id="size5" name="boardSize" value="5" class="hidden peer">
                    <label for="size5" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">5x5</label>
                </div>
                <div>
                    <input type="radio" id="size6" name="boardSize" value="6" class="hidden peer">
                    <label for="size6" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">6x6</label>
                </div>
            </div>
        </div>
        <button id="join-button" class="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-violet-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar</button>
    `;
    modal.classList.remove('hidden');

    // Asignamos el evento al botón recién creado
    const joinButton = document.getElementById('join-button');
    joinButton.addEventListener('click', () => {
        const nameInput = document.getElementById('name-input');
        const name = nameInput.value;
        if (!name) {
            alert('Por favor, escribe tu nombre.');
            return;
        }
        const size = document.querySelector('input[name="boardSize"]:checked').value;
        sendMessage('join', { name, size: parseInt(size) });
    });
}

function showGameOverModal(winnerSymbol, gameState) {
    let title, body;
    if (winnerSymbol === 'draw') {
        title = "¡Es un Empate!";
        body = "Buena partida. ¿Listos para la revancha?";
    } else {
        const winnerName = gameState.playersInfo[winnerSymbol];
        title = "¡Tenemos un Ganador!";
        body = `Felicidades, <span class="font-bold text-white">${winnerName}</span>. ¡Has ganado la partida!`;
    }

    modalContent.innerHTML = `
        <h2 class="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">${title}</h2>
        <p class="text-xl text-gray-300">${body}</p>
        <button id="reset-button" class="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-violet-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar de Nuevo</button>
    `;
    modal.classList.remove('hidden');
    
    // Asignamos el evento al botón de reseteo recién creado
    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', () => {
        // El botón solo envía el mensaje. El servidor se encargará de actualizar la UI para todos.
        sendMessage('reset');
    });
}

function createBoard(size) {
    if (currentBoardSize === size && cells.length > 0) return;
    currentBoardSize = size;
    
    boardElement.innerHTML = '';
    cells = [];
    
    boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    
    const fontSize = size > 4 ? '2.5rem' : '3.5rem';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.style.fontSize = fontSize;
        cell.classList.add(
            'bg-gray-800/50', 'rounded-lg', 'flex', 'items-center', 
            'justify-center', 'font-bold', 'hover:bg-gray-700/50', 
            'cursor-pointer', 'transition-all', 'duration-200', 'border', 'border-gray-700/50'
        );
        cells.push(cell);
        boardElement.appendChild(cell);
    }
    setupCellListeners();
}

function setupCellListeners() {
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            if (isGameActive && cell.innerHTML === '') {
                sendMessage('move', { index });
            }
        });
    });
}

function renderBoard(board) {
    board.forEach((value, index) => {
        if(cells[index]) {
            const icon = value === 'X' ? ICON_X : (value === 'O' ? ICON_O : '');
            if (cells[index].innerHTML === '' && icon !== '') {
                cells[index].innerHTML = icon;
            } else if (icon === '') {
                cells[index].innerHTML = '';
            }
        }
    });
}

function updateTurnIndicator(gameState) {
    playerXScoreElement.classList.remove('turn-active');
    playerOScoreElement.classList.remove('turn-active');

    if (gameState.gameActive) {
        if (gameState.currentPlayer === 'X') {
            playerXScoreElement.classList.add('turn-active');
        } else {
            playerOScoreElement.classList.add('turn-active');
        }
    }
}

function updateScoreboardAndStatus(gameState) {
    const playerXName = gameState.playersInfo.X || 'Jugador X';
    const playerOName = gameState.playersInfo.O || 'Jugador O';

    playerXScoreElement.querySelector('.player-name').textContent = playerXName;
    playerXScoreElement.querySelector('.score').textContent = gameState.scores.X;
    playerOScoreElement.querySelector('.player-name').textContent = playerOName;
    playerOScoreElement.querySelector('.score').textContent = gameState.scores.O;

    if (gameState.gameActive) {
        const currentPlayerName = gameState.playersInfo[gameState.currentPlayer];
        if (!gameState.playersInfo.X || !gameState.playersInfo.O) {
            statusElement.textContent = "Esperando oponente...";
        } else if (mySymbol === gameState.currentPlayer) {
            statusElement.textContent = "Es tu turno";
        } else {
            statusElement.textContent = `Turno de ${currentPlayerName}`;
        }
    }
    updateTurnIndicator(gameState);
}

function sendMessage(type, payload) {
    ws.send(JSON.stringify({ type, payload }));
}

// --- MANEJADOR DE MENSAJES DEL SERVIDOR ---
ws.onmessage = (event) => {
    try {
        const { type, payload } = JSON.parse(event.data);
        const gameState = payload ? payload.gameState : null;

        switch (type) {
            case 'assignSymbol':
                mySymbol = payload.symbol;
                modal.classList.add('hidden'); // Ocultamos el modal de inicio
                break;
            case 'update':
                // --- CAMBIO CLAVE AQUÍ ---
                // Cuando recibimos un 'update' (que el servidor envía al reiniciar),
                // nos aseguramos de que el modal de fin de partida se oculte.
                modal.classList.add('hidden');
                isGameActive = gameState.gameActive;
                createBoard(gameState.size);
                renderBoard(gameState.board);
                updateScoreboardAndStatus(gameState);
                break;
            case 'gameOver':
                isGameActive = false;
                renderBoard(gameState.board);
                updateScoreboardAndStatus(gameState);
                showGameOverModal(payload.winnerSymbol, gameState);
                break;
            case 'opponentLeft':
                alert("Tu oponente se ha desconectado. Serás devuelto a la pantalla de inicio.");
                window.location.reload();
                break;
            case 'error':
                alert(`Error: ${payload.message}`);
                break;
        }
    } catch (error) {
        console.error("Error al procesar el mensaje del servidor:", error);
    }
};

// --- INICIO DEL SCRIPT ---
// Al cargar la página, mostramos el modal para unirse.
showJoinModal();

const ICON_X = `<svg class="w-3/4 h-3/4 text-cyan-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_O = `<svg class="w-3/4 h-3/4 text-amber-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;