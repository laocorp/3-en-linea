// public/script.js - VERSIÓN OPTIMIZADA BASADA EN ESTADO

// --- ESTADO DEL CLIENTE ---
// Guardamos todo el estado relevante del cliente en un solo objeto.
const clientState = {
    ws: new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`),
    mySymbol: null,
    playerId: null,
    isGameActive: false,
    currentBoardSize: 0,
    cells: []
};

// --- SELECTORES DEL DOM (solo los que no se regeneran) ---
const boardElement = document.getElementById('board');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');

// --- ICONOS SVG ---
const ICON_X = `<svg class="w-3/4 h-3/4 text-cyan-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_O = `<svg class="w-3/4 h-3/4 text-amber-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;

/**
 * La función RENDER principal. Es la única responsable de actualizar el DOM.
 * Lee el estado del juego (gameState) y actualiza la UI para que coincida.
 * @param {object} gameState - El estado completo de la partida recibido del servidor.
 */
function render(gameState) {
    if (!gameState) {
        showJoinModal();
        return;
    }

    modal.classList.add('hidden');
    clientState.isGameActive = gameState.gameActive;

    // 1. Crear o actualizar el tablero
    createBoard(gameState.size);
    renderBoardSymbols(gameState.board);

    // 2. Actualizar el Scoreboard y el estado
    const { playersInfo, scores, currentPlayer, gameActive } = gameState;
    const playerXName = playersInfo.X.name || 'Jugador X';
    const playerOName = playersInfo.O.name || 'Jugador O';

    document.querySelector('#player-x-score .player-name').textContent = playerXName;
    document.querySelector('#player-x-score .score').textContent = scores.X;
    document.querySelector('#player-o-score .player-name').textContent = playerOName;
    document.querySelector('#player-o-score .score').textContent = scores.O;

    // 3. Actualizar el indicador de turno
    document.getElementById('player-x-score').classList.toggle('turn-active', gameActive && currentPlayer === 'X');
    document.getElementById('player-o-score').classList.toggle('turn-active', gameActive && currentPlayer === 'O');

    // 4. Actualizar el mensaje de estado
    const statusElement = document.getElementById('status');
    if (gameActive) {
        if (!playersInfo.X.name || !playersInfo.O.name) {
            statusElement.textContent = "Esperando oponente...";
        } else {
            statusElement.textContent = clientState.mySymbol === currentPlayer ? "Es tu turno" : `Turno de ${playersInfo[currentPlayer].name}`;
        }
    }
}

function createBoard(size) {
    if (clientState.currentBoardSize === size) return;
    clientState.currentBoardSize = size;
    boardElement.innerHTML = '';
    clientState.cells = [];
    boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    const fontSize = size > 4 ? '2.5rem' : '3.5rem';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.style.fontSize = fontSize;
        cell.classList.add('bg-gray-800/50', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'font-bold', 'hover:bg-gray-700/50', 'cursor-pointer', 'transition-all', 'duration-200', 'border', 'border-gray-700/50');
        cell.addEventListener('click', () => {
            if (clientState.isGameActive && cell.innerHTML === '') {
                sendMessage('move', { index: i });
            }
        });
        clientState.cells.push(cell);
        boardElement.appendChild(cell);
    }
}

function renderBoardSymbols(board) {
    board.forEach((value, index) => {
        if (clientState.cells[index]) {
            const icon = value === 'X' ? ICON_X : (value === 'O' ? ICON_O : '');
            if (clientState.cells[index].innerHTML === '' && icon !== '') {
                clientState.cells[index].innerHTML = icon;
            } else if (icon === '') {
                clientState.cells[index].innerHTML = '';
            }
        }
    });
}

function showJoinModal() {
    modalContent.innerHTML = `
        <h1 class="text-4xl font-bold text-center bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">Tic-Tac-Toe</h1>
        <input type="text" id="name-input" placeholder="Escribe tu nombre" maxlength="12" class="bg-gray-900/70 border border-gray-700 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-violet-500 transition">
        <div>
            <h2 class="text-lg font-semibold text-center text-gray-400 mb-3">Elige el tamaño</h2>
            <div class="grid grid-cols-4 gap-2 text-sm">
                <div><input type="radio" id="size3" name="boardSize" value="3" class="hidden peer" checked><label for="size3" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">3x3</label></div>
                <div><input type="radio" id="size4" name="boardSize" value="4" class="hidden peer"><label for="size4" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">4x4</label></div>
                <div><input type="radio" id="size5" name="boardSize" value="5" class="hidden peer"><label for="size5" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">5x5</label></div>
                <div><input type="radio" id="size6" name="boardSize" value="6" class="hidden peer"><label for="size6" class="block w-full text-center p-3 rounded-lg cursor-pointer bg-slate-700 text-slate-300 ring-2 ring-transparent peer-checked:bg-teal-400 peer-checked:text-slate-900 peer-checked:font-bold transition-all duration-200">6x6</label></div>
            </div>
        </div>
        <button id="join-button" class="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-violet-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar</button>
    `;
    modal.classList.remove('hidden');
    document.getElementById('join-button').addEventListener('click', () => {
        const name = document.getElementById('name-input').value;
        if (!name) { alert('Por favor, escribe tu nombre.'); return; }
        const size = document.querySelector('input[name="boardSize"]:checked').value;
        sendMessage('join', { name, size: parseInt(size) });
    });
}

function showGameOverModal(winnerSymbol, gameState) {
    let title = winnerSymbol === 'draw' ? "¡Es un Empate!" : "¡Tenemos un Ganador!";
    let body = winnerSymbol === 'draw' ? "Buena partida. ¿Listos para la revancha?" : `Felicidades, <span class="font-bold text-white">${gameState.playersInfo[winnerSymbol].name}</span>. ¡Has ganado la partida!`;

    modalContent.innerHTML = `
        <h2 class="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">${title}</h2>
        <p class="text-xl text-gray-300">${body}</p>
        <button id="reset-button" class="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-violet-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">Jugar de Nuevo</button>
    `;
    modal.classList.remove('hidden');
    document.getElementById('reset-button').addEventListener('click', () => sendMessage('reset'));
}

function sendMessage(type, payload) {
    clientState.ws.send(JSON.stringify({ type, payload }));
}

// --- MANEJADOR DE MENSAJES DEL SERVIDOR ---
clientState.ws.onmessage = (event) => {
    try {
        const { type, payload } = JSON.parse(event.data);

        switch (type) {
            case 'assignIdentity':
                clientState.mySymbol = payload.symbol;
                clientState.playerId = payload.playerId;
                sessionStorage.setItem('playerId', payload.playerId);
                break;
            case 'update':
                render(payload.gameState);
                break;
            case 'gameOver':
                render(payload.gameState);
                showGameOverModal(payload.winnerSymbol, payload.gameState);
                break;
            case 'opponentLeft':
                alert("Tu oponente se ha desconectado. El juego se reiniciará.");
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

clientState.ws.onopen = () => {
    console.log("Conectado al servidor.");
    const playerId = sessionStorage.getItem('playerId');
    // La lógica de reconexión se ha eliminado para esta versión simplificada.
    // Siempre mostramos el modal de inicio.
    showJoinModal();
};