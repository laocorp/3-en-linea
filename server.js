// server.js - VERSIÓN DE PARTIDA ÚNICA Y COMENTADA

// Importamos las librerías necesarias.
// 'express' para servir nuestros archivos HTML, CSS, etc.
// 'http' para crear un servidor HTTP.
// 'ws' para la comunicación en tiempo real con WebSockets.
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Creamos la aplicación Express y el servidor HTTP.
const app = express();
const server = http.createServer(app);

// Creamos un servidor de WebSockets y lo enlazamos al servidor HTTP.
const wss = new WebSocket.Server({ server });

// Configuramos Express para que sirva los archivos estáticos de la carpeta 'public'.
// Aquí es donde vivirán nuestro index.html, script.js, etc.
app.use(express.static('public'));

// --- ESTADO DEL JUEGO ---
// 'players' es un array que contendrá las conexiones de los 2 jugadores.
let players = [];
// 'gameState' es un objeto que contiene toda la información de la partida actual.
let gameState = createNewGameState();

/**
 * Crea un objeto de estado de juego nuevo y limpio.
 * Se llama al iniciar el servidor o al reiniciar una partida.
 * @returns {object} El objeto de estado del juego.
 */
function createNewGameState() {
    return {
        playersInfo: { X: null, O: null }, // Nombres de los jugadores
        board: Array(9).fill(null),        // El tablero, un array de 9 posiciones, inicialmente vacío (null)
        currentPlayer: 'X',                 // El jugador que tiene el turno, siempre empieza 'X'
        gameActive: true,                   // Un booleano para saber si la partida está en curso
        scores: { X: 0, O: 0 }              // El marcador de victorias
    };
}

/**
 * Revisa el tablero para ver si algún jugador ha ganado.
 * @param {Array<string|null>} board - El estado actual del tablero.
 * @returns {string|null} Retorna el símbolo del ganador ('X' o 'O') o null si no hay ganador.
 */
function checkWin(board) {
    // Estas son todas las combinaciones de celdas que resultan en una victoria.
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
        [0, 4, 8], [2, 4, 6]             // Diagonales
    ];
    // Recorremos cada posible línea ganadora.
    for (const line of lines) {
        const [a, b, c] = line;
        // Si la primera celda de la línea no está vacía y las tres celdas son iguales...
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // ...entonces tenemos un ganador.
        }
    }
    return null; // Si el bucle termina, no hay ganador.
}

/**
 * Envía un mensaje a todos los jugadores conectados.
 * @param {object} data - El objeto de datos que se enviará (se convertirá a JSON).
 */
function broadcast(data) {
    // Recorremos el array de jugadores.
    players.forEach(player => {
        // Nos aseguramos de que la conexión del jugador esté abierta.
        if (player.ws.readyState === WebSocket.OPEN) {
            // Enviamos los datos convertidos a un string JSON.
            player.ws.send(JSON.stringify(data));
        }
    });
}

/**
 * Reinicia la partida, pero mantiene los puntajes y nombres de los jugadores.
 */
function resetGame() {
    const oldScores = gameState.scores;
    const oldPlayerNames = gameState.playersInfo;
    gameState = createNewGameState(); // Crea un tablero y estado nuevos.
    gameState.scores = oldScores; // Restaura los puntajes.
    gameState.playersInfo = oldPlayerNames; // Restaura los nombres.
    // Notifica a ambos jugadores que el estado se ha actualizado (tablero vacío).
    broadcast({ type: 'update', payload: { gameState } });
}

// --- LÓGICA DE CONEXIÓN ---
// Este bloque se ejecuta cada vez que un nuevo usuario se conecta al servidor.
wss.on('connection', ws => {
    // Si ya hay 2 jugadores, rechaza la conexión.
    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'La partida ya está llena.' }));
        ws.close();
        return;
    }

    // Crea un objeto para el nuevo jugador.
    const player = {
        ws, // La conexión WebSocket del jugador.
        symbol: players.length === 0 ? 'X' : 'O' // Asigna 'X' al primero, 'O' al segundo.
    };
    players.push(player); // Añade al jugador al array de jugadores activos.
    console.log(`Jugador conectado. Total: ${players.length}`);

    // Este bloque se ejecuta cada vez que el servidor recibe un mensaje de este jugador.
    ws.on('message', message => {
        try {
            const data = JSON.parse(message); // Convierte el mensaje de string a objeto.
            const { type, payload } = data;   // Extrae el tipo de mensaje y los datos.

            // --- MANEJO DE TIPOS DE MENSAJE ---

            // Si el mensaje es de tipo 'join', el jugador está enviando su nombre.
            if (type === 'join') {
                gameState.playersInfo[player.symbol] = payload.name; // Guarda el nombre.
                // Le dice al cliente qué símbolo le ha tocado ('X' o 'O').
                ws.send(JSON.stringify({ type: 'assignSymbol', payload: { symbol: player.symbol } }));
                // Envía el estado actualizado del juego a todos.
                broadcast({ type: 'update', payload: { gameState } });
            }

            // Si el mensaje es de tipo 'move'.
            if (type === 'move' && gameState.gameActive && player.symbol === gameState.currentPlayer) {
                // Si la celda está vacía...
                if (gameState.board[payload.index] === null) {
                    // ...registra el movimiento.
                    gameState.board[payload.index] = gameState.currentPlayer;
                    const winnerSymbol = checkWin(gameState.board);

                    if (winnerSymbol) {
                        // Si hay un ganador...
                        gameState.gameActive = false; // ...el juego se detiene.
                        gameState.scores[winnerSymbol]++; // ...se incrementa su puntaje.
                        broadcast({ type: 'gameOver', payload: { winnerSymbol, gameState } }); // ...se notifica a todos.
                    } else if (!gameState.board.includes(null)) {
                        // Si no hay ganador Y el tablero está lleno...
                        gameState.gameActive = false; // ...el juego se detiene.
                        broadcast({ type: 'gameOver', payload: { winnerSymbol: 'draw', gameState } }); // ...es un empate.
                    } else {
                        // Si no hay ganador ni empate...
                        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X'; // ...se cambia el turno.
                        broadcast({ type: 'update', payload: { gameState } }); // ...se notifica a todos.
                    }
                }
            }

            // Si el mensaje es de tipo 'reset'.
            if (type === 'reset') {
                if(players.length === 2) resetGame();
            }

        } catch (error) {
            console.error("Error procesando mensaje:", error);
        }
    });

    // Este bloque se ejecuta cuando este jugador se desconecta.
    ws.on('close', () => {
        players = players.filter(p => p.ws !== ws); // Lo elimina del array de jugadores.
        console.log(`Jugador desconectado. Total: ${players.length}`);
        // Reinicia completamente el juego para los siguientes jugadores.
        gameState = createNewGameState();
        // Notifica al jugador restante (si lo hay) que su oponente se fue.
        broadcast({ type: 'opponentLeft' });
    });
});

// El servidor empieza a escuchar en el puerto 3000.
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor de partida única corriendo en http://localhost:${PORT}`);
});