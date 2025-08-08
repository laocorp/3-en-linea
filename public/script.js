// public/script.js - VERSIÓN FINAL COMPLETA CON EFECTOS DE SONIDO

// --- OBJETOS DE AUDIO ---
const soundMove = new Audio('sounds/move.mp3');
const soundWin = new Audio('sounds/win.mp3');
const soundDraw = new Audio('sounds/draw.mp3');

// --- SELECTORES DEL DOM ---
const joinSection = document.getElementById('join-section');
const gameSection = document.getElementById('game-section');
const nameInput = document.getElementById('name-input');
const joinButton = document.getElementById('join-button');
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const playerXScoreElement = document.getElementById('player-x-score');
const playerOScoreElement = document.getElementById('player-o-score');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const winningLineElement = document.getElementById('winning-line');
let cells = [];

// --- ESTADO DEL CLIENTE ---
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
let mySymbol = null;
let currentBoardSize = 0;
let isGameActive = false;
let lastMoveCount = 0; // Para saber cuándo se ha hecho un nuevo movimiento

// --- FUNCIONES DE LA INTERFAZ ---
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
        cell.classList.add('bg-gray-800/50', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'font-bold', 'hover:bg-gray-700/50', 'cursor-pointer', 'transition-all', 'duration-200', 'border', 'border-gray-700/50');
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
        if (cells[index]) {
            const icon = value === 'X' ? ICON_X : (value === 'O' ? ICON_O : '');
            if (cells[index].innerHTML === '' && icon !== '') cells[index].innerHTML = icon;
            else if (icon === '') cells[index].innerHTML = '';
        }
    });
}
function updateTurnIndicator(gameState) {
    playerXScoreElement.classList.toggle('turn-active', gameState.gameActive && gameState.currentPlayer === 'X');
    playerOScoreElement.classList.toggle('turn-active', gameState.gameActive && gameState.currentPlayer === 'O');
}
function updateScoreboardAndStatus(gameState) {
    const playerXName = gameState.playersInfo.X.name || 'Jugador X';
    const playerOName = gameState.playersInfo.O.name || 'Jugador O';
    playerXScoreElement.querySelector('.player-name').textContent = playerXName;
    playerXScoreElement.querySelector('.score').textContent = gameState.scores.X;
    playerOScoreElement.querySelector('.player-name').textContent = playerOName;
    playerOScoreElement.querySelector('.score').textContent = gameState.scores.O;
    if (gameState.gameActive) {
        const currentPlayerName = gameState.playersInfo[gameState.currentPlayer].name;
        if (!gameState.playersInfo.X.name || !gameState.playersInfo.O.name) {
            statusElement.textContent = "Esperando oponente...";
        } else if (mySymbol === gameState.currentPlayer) {
            statusElement.textContent = "Es tu turno";
        } else {
            statusElement.textContent = `Turno de ${currentPlayerName}`;
        }
    }
    updateTurnIndicator(gameState);
}
function showGameOverModal(winnerSymbol, gameState) {
    const modalTitle = modal.querySelector('#modal-title');
    const modalBody = modal.querySelector('#modal-body');
    const resetButton = modal.querySelector('#reset-button');
    if (winnerSymbol === 'draw') {
        modalTitle.textContent = "¡Es un Empate!";
        modalBody.textContent = "Buena partida. ¿Listos para la revancha?";
    } else {
        const winnerName = gameState.playersInfo[winnerSymbol].name;
        modalTitle.textContent = "¡Tenemos un Ganador!";
        modalBody.innerHTML = `Felicidades, <span class="font-bold text-white">${winnerName}</span>. ¡Has ganado la partida!`;
    }
    resetButton.textContent = "Jugar de Nuevo";
    modal.classList.remove('hidden');
    resetButton.onclick = () => {
        modal.classList.add('hidden');
        winningLineElement.className = '';
        sendMessage('reset');
    };
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
                joinSection.classList.add('hidden');
                gameSection.classList.remove('hidden');
                break;
            case 'update':
                winningLineElement.className = '';
                isGameActive = gameState.gameActive;
                createBoard(gameState.size);
                
                const moveCount = gameState.board.filter(Boolean).length;
                if (moveCount > 0 && moveCount !== lastMoveCount) {
                    soundMove.play().catch(e => console.error("Error al reproducir sonido:", e));
                }
                lastMoveCount = moveCount;

                renderBoard(gameState.board);
                updateScoreboardAndStatus(gameState);
                modal.classList.add('hidden');
                break;
            case 'gameOver':
                isGameActive = false;
                renderBoard(gameState.board);
                updateScoreboardAndStatus(gameState);
                showGameOverModal(payload.winnerSymbol, gameState);

                if (payload.winnerSymbol === 'draw') {
                    soundDraw.play().catch(e => console.error("Error al reproducir sonido:", e));
                } else {
                    soundWin.play().catch(e => console.error("Error al reproducir sonido:", e));
                }

                if (payload.winningLineId) {
                    winningLineElement.className = payload.winningLineId;
                    setTimeout(() => {
                        winningLineElement.classList.add('visible');
                    }, 50);
                }
                lastMoveCount = 0; // Resetea el contador para la siguiente partida
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

joinButton.addEventListener('click', () => {
    const name = nameInput.value;
    if (!name) {
        alert('Por favor, escribe tu nombre.');
        return;
    }
    const size = document.querySelector('input[name="boardSize"]:checked').value;
    sendMessage('join', { name, size: parseInt(size) });
});

const ICON_X = `<svg class="w-3/4 h-3/4 text-cyan-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_O = `<svg class="w-3/4 h-3/4 text-amber-400 symbol-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;