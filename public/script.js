// public/script.js - VERSIÓN FINAL Y VERIFICADA PARA PARTIDA ÚNICA
// --- SELECCIÓN DE ELEMENTOS DEL DOM ---
const joinSection = document.getElementById('join-section');
const gameSection = document.getElementById('game-section');

const nameInput = document.getElementById('name-input');
const joinButton = document.getElementById('join-button');

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const resetButton = document.getElementById('reset-button');
const winningLineElement = document.getElementById('winning-line');
const playerXScoreElement = document.getElementById('player-x-score');
const playerOScoreElement = document.getElementById('player-o-score');
const cells = [];

// --- CONEXIÓN WEBSOCKET ---
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);

let mySymbol = null;

// --- FUNCIONES DE LA INTERFAZ ---
function renderBoard(board) {
    board.forEach((value, index) => {
        cells[index].innerHTML = value ? `<span>${value}</span>` : '';
    });
}

function updateStatus(gameState, winnerSymbol = null) {
    if (!gameState.gameActive) {
        if (winnerSymbol === 'draw') {
            statusElement.textContent = "¡Es un empate!";
        } else {
            const winnerName = gameState.playersInfo[winnerSymbol];
            statusElement.textContent = `¡El ganador es ${winnerName}! 🎉`;
        }
    } else {
        const currentPlayerName = gameState.playersInfo[gameState.currentPlayer];
        if (!gameState.playersInfo.X || !gameState.playersInfo.O) {
            statusElement.textContent = "Esperando oponente...";
        } else if (mySymbol === gameState.currentPlayer) {
            statusElement.textContent = `Es tu turno, ${currentPlayerName}`;
        } else {
            statusElement.textContent = `Turno de ${currentPlayerName}`;
        }
    }
}

function updateScoreboard(gameState) {
    const playerXName = gameState.playersInfo.X || 'Jugador X';
    const playerOName = gameState.playersInfo.O || 'Jugador O';

    playerXScoreElement.querySelector('.player-name').textContent = playerXName;
    playerXScoreElement.querySelector('.score').textContent = gameState.scores.X;
    
    playerOScoreElement.querySelector('.player-name').textContent = playerOName;
    playerOScoreElement.querySelector('.score').textContent = gameState.scores.O;
}

function sendMessage(type, payload) {
    ws.send(JSON.stringify({ type, payload }));
}

// --- MANEJADOR DE MENSAJES DEL SERVIDOR ---
ws.onmessage = (event) => {
    try {
        const { type, payload } = JSON.parse(event.data);

        switch (type) {
            case 'assignSymbol':
                mySymbol = payload.symbol;
                joinSection.classList.add('hidden');
                gameSection.classList.remove('hidden');
                break;
            case 'update':
                renderBoard(payload.gameState.board);
                updateStatus(payload.gameState);
                updateScoreboard(payload.gameState);
                break;
            case 'gameOver':
                renderBoard(payload.gameState.board);
                updateStatus(payload.gameState, payload.winnerSymbol); // Llamada corregida
                updateScoreboard(payload.gameState);
                // La lógica de la línea ganadora se elimina ya que el servidor simple no la envía
                break;
            case 'opponentLeft':
                alert("Tu oponente se ha desconectado. El juego se reiniciará.");
                window.location.reload(); // Recargamos la página para un estado limpio
                break;
            case 'error':
                alert(`Error: ${payload.message}`);
                break;
        }
    } catch (error) {
        console.error("Error procesando mensaje del servidor:", error);
    }
};

// --- EVENT LISTENERS (ESCUCHADORES DE EVENTOS) ---
joinButton.addEventListener('click', () => {
    const name = nameInput.value;
    if (!name) {
        alert('Por favor, escribe tu nombre.');
        return;
    }
    sendMessage('join', { name });
});

resetButton.addEventListener('click', () => {
    winningLineElement.className = 'hidden';
    sendMessage('reset');
});

// --- CREACIÓN DINÁMICA DEL TABLERO ---
for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add(
        'bg-slate-800', 'rounded-lg', 'flex', 'items-center', 
        'justify-center', 'text-5xl', 'font-bold', 'hover:bg-slate-700', 
        'cursor-pointer', 'transition-colors', 'text-slate-300'
    );
    cell.addEventListener('click', () => {
        if (cell.innerHTML === '') {
            sendMessage('move', { index: i });
        }
    });
    cells.push(cell);
    boardElement.appendChild(cell);
} 