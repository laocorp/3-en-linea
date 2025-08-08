// public/script.js - VERSIÓN DE PARTIDA ÚNICA Y COMENTADA

// --- SELECCIÓN DE ELEMENTOS DEL DOM ---
// Guardamos referencias a los elementos HTML para poder manipularlos fácilmente.
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
const cells = []; // Un array que guardará las 9 celdas del tablero.

// --- CONEXIÓN WEBSOCKET ---
// Establecemos la conexión con el servidor.
// La lógica `${...}` elige 'wss' (seguro) si la página se carga con https, o 'ws' (inseguro) si es http.
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);

// Variable para guardar qué símbolo ('X' o 'O') es este jugador.
let mySymbol = null;

// --- FUNCIONES DE LA INTERFAZ ---

/**
 * Dibuja el tablero en la pantalla basándose en el estado recibido del servidor.
 * @param {Array<string|null>} board - El array de 9 posiciones del tablero.
 */
function renderBoard(board) {
    board.forEach((value, index) => {
        // Actualiza el contenido de cada celda. El span es para la animación de pop-in.
        cells[index].innerHTML = value ? `<span>${value}</span>` : '';
    });
}

/**
 * Actualiza el mensaje de estado del juego (ej: "Tu turno", "Ganador", "Empate").
 * @param {object} gameState - El objeto de estado del juego del servidor.
 */
function updateStatus(gameState, winnerSymbol = null) {
    if (!gameState.gameActive) {
        // La condición ahora usa el 'winnerSymbol' que recibe la función
        if (winnerSymbol === 'draw') {
            statusElement.textContent = "¡Es un empate!";
        } else {
            // Y aquí también, para encontrar el nombre correcto
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

/**
 * Actualiza el scoreboard con los nombres y puntajes de los jugadores.
 * @param {object} gameState - El objeto de estado del juego del servidor.
 */
function updateScoreboard(gameState) {
    const playerXName = gameState.playersInfo.X || 'Jugador X';
    const playerOName = gameState.playersInfo.O || 'Jugador O';

    playerXScoreElement.querySelector('.player-name').textContent = playerXName;
    playerXScoreElement.querySelector('.score').textContent = gameState.scores.X;
    
    playerOScoreElement.querySelector('.player-name').textContent = playerOName;
    playerOScoreElement.querySelector('.score').textContent = gameState.scores.O;
}

/**
 * Función auxiliar para enviar mensajes al servidor en el formato correcto (JSON).
 * @param {string} type - El tipo de mensaje ('join', 'move', etc.).
 * @param {object} [payload] - Los datos que se enviarán.
 */
function sendMessage(type, payload) {
    ws.send(JSON.stringify({ type, payload }));
}


// --- MANEJADOR DE MENSAJES DEL SERVIDOR ---
// Este bloque se ejecuta cada vez que llega un mensaje desde el servidor.
ws.onmessage = (event) => {
    try {
        const { type, payload } = JSON.parse(event.data); // Convierte el mensaje a objeto.

        // Un switch para reaccionar según el tipo de mensaje.
        switch (type) {
            // El servidor nos asigna nuestro símbolo ('X' o 'O').
            case 'assignSymbol':
                mySymbol = payload.symbol;
                joinSection.classList.add('hidden'); // Oculta la pantalla de inicio.
                gameSection.classList.remove('hidden'); // Muestra la pantalla del juego.
                break;
            // El servidor nos envía una actualización del estado del juego.
            case 'update':
            case 'gameOver': // 'gameOver' también actualiza el tablero final.
                renderBoard(payload.gameState.board);
                updateStatus(payload.gameState, payload.winnerSymbol);
                if (type === 'gameOver' && payload.winnerSymbol && payload.winnerSymbol !== 'draw') {
                    // Lógica para mostrar la línea ganadora (si se implementa).
                }
                break;
            // El servidor nos informa que el oponente se ha ido.
            case 'opponentLeft':
                alert("Tu oponente se ha desconectado. El juego se reiniciará.");
                joinSection.classList.remove('hidden');
                gameSection.classList.add('hidden');
                mySymbol = null; // Resetea nuestro símbolo.
                break;
            // El servidor nos envía un mensaje de error.
            case 'error':
                alert(`Error: ${payload.message}`);
                break;
        }
    } catch (error) {
        console.error("Error procesando mensaje del servidor:", error);
    }
};


// --- EVENT LISTENERS (ESCUCHADORES DE EVENTOS) ---

// Se ejecuta cuando se hace clic en el botón "Jugar".
joinButton.addEventListener('click', () => {
    const name = nameInput.value;
    if (!name) {
        alert('Por favor, escribe tu nombre.');
        return;
    }
    // Envía el nombre al servidor.
    sendMessage('join', { name });
});

// Se ejecuta cuando se hace clic en el botón "Jugar de Nuevo".
resetButton.addEventListener('click', () => {
    winningLineElement.className = 'hidden'; // Oculta la línea ganadora.
    sendMessage('reset'); // Pide al servidor que reinicie la partida.
});


// --- CREACIÓN DINÁMICA DEL TABLERO ---
// Este bucle se ejecuta una sola vez cuando la página carga.
for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div'); // Crea un <div>.

    // Le añade todas las clases de Tailwind para que se vea bien.
    cell.classList.add(
        'bg-slate-800', 'rounded-lg', 'flex', 'items-center', 
        'justify-center', 'text-5xl', 'font-bold', 'hover:bg-slate-700', 
        'cursor-pointer', 'transition-colors', 'text-slate-300'
    );
    // Le añade un escuchador de clics a cada celda.
    cell.addEventListener('click', () => {
        // Solo envía el movimiento si la celda está vacía.
        if (cell.innerHTML === '') {
            sendMessage('move', { index: i });
        }
    });
    cells.push(cell); // Guarda la referencia a la celda en nuestro array.
    boardElement.appendChild(cell); // Añade la celda al tablero en el HTML.
}