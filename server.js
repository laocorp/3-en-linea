// server.js - VERSIÓN FINAL CON TABLERO DINÁMICO
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

let players = [];
let gameState = null; // El estado del juego se creará cuando el primer jugador se una.

/**
 * Crea un objeto de estado de juego nuevo basado en el tamaño del tablero.
 * @param {number} size - El tamaño del lado del tablero (ej. 3 para un 3x3).
 * @returns {object} El objeto de estado del juego inicializado.
 */
function createNewGameState(size) {
    let winCondition;
    if (size === 3) winCondition = 3;
    else if (size === 4) winCondition = 4;
    else winCondition = 5; // Para 5x5 y 6x6, se necesitan 5 en raya.

    return {
        size: size,
        winCondition: winCondition,
        playersInfo: { X: null, O: null },
        board: Array(size * size).fill(null),
        currentPlayer: 'X',
        gameActive: true,
        scores: { X: 0, O: 0 }
    };
}

/**
 * ALGORITMO DE VICTORIA DINÁMICO
 * Revisa el tablero para ver si algún jugador ha ganado.
 * @param {Array<string|null>} board - El estado actual del tablero.
 * @param {number} size - El tamaño del tablero (ej. 3, 4, 5, o 6).
 * @param {number} winCondition - El número de fichas en raya necesarias para ganar.
 * @returns {string|null} Retorna el símbolo del ganador ('X' o 'O') o null si no hay ganador.
 */
function checkWin(board, size, winCondition) {
    const getCell = (row, col) => row * size + col;

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const player = board[getCell(row, col)];
            if (!player) continue;

            // Comprobar horizontal (→)
            if (col <= size - winCondition) {
                let count = 1;
                for (let i = 1; i < winCondition; i++) {
                    if (board[getCell(row, col + i)] === player) count++;
                }
                if (count === winCondition) return player;
            }

            // Comprobar vertical (↓)
            if (row <= size - winCondition) {
                let count = 1;
                for (let i = 1; i < winCondition; i++) {
                    if (board[getCell(row + i, col)] === player) count++;
                }
                if (count === winCondition) return player;
            }

            // Comprobar diagonal (↘)
            if (row <= size - winCondition && col <= size - winCondition) {
                let count = 1;
                for (let i = 1; i < winCondition; i++) {
                    if (board[getCell(row + i, col + i)] === player) count++;
                }
                if (count === winCondition) return player;
            }

            // Comprobar diagonal (↙)
            if (row <= size - winCondition && col >= winCondition - 1) {
                let count = 1;
                for (let i = 1; i < winCondition; i++) {
                    if (board[getCell(row + i, col - i)] === player) count++;
                }
                if (count === winCondition) return player;
            }
        }
    }
    return null;
}

function broadcast(data) {
    players.forEach(player => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(data));
        }
    });
}

function resetGame() {
    const oldScores = gameState.scores;
    const oldPlayerNames = gameState.playersInfo;
    const size = gameState.size;
    gameState = createNewGameState(size);
    gameState.scores = oldScores;
    gameState.playersInfo = oldPlayerNames;
    broadcast({ type: 'update', payload: { gameState } });
}

wss.on('connection', ws => {
    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'La partida ya está llena.' }));
        ws.close();
        return;
    }

    const player = {
        ws,
        symbol: players.length === 0 ? 'X' : 'O'
    };
    players.push(player);
    console.log(`Jugador conectado. Total: ${players.length}`);

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            const { type, payload } = data;

            if (type === 'join') {
                if (!gameState) {
                    gameState = createNewGameState(payload.size);
                }
                gameState.playersInfo[player.symbol] = payload.name;
                ws.send(JSON.stringify({ type: 'assignSymbol', payload: { symbol: player.symbol } }));
                broadcast({ type: 'update', payload: { gameState } });
            }

            if (type === 'move') {
                // Esta guarda es la defensa principal del servidor.
                if (!gameState || !gameState.gameActive) return;

                if (player.symbol === gameState.currentPlayer) {
                    if (gameState.board[payload.index] === null) {
                        gameState.board[payload.index] = gameState.currentPlayer;
                        const winnerSymbol = checkWin(gameState.board, gameState.size, gameState.winCondition);

                        if (winnerSymbol) {
                            gameState.gameActive = false;
                            gameState.scores[winnerSymbol]++;
                            broadcast({ type: 'gameOver', payload: { winnerSymbol, gameState } });
                        } else if (!gameState.board.includes(null)) {
                            gameState.gameActive = false;
                            broadcast({ type: 'gameOver', payload: { winnerSymbol: 'draw', gameState } });
                        } else {
                            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
                            broadcast({ type: 'update', payload: { gameState } });
                        }
                    }
                }
            }

            if (type === 'reset') {
                if(players.length === 2 && gameState) resetGame();
            }

        } catch (error) {
            console.error("Error procesando mensaje:", error);
        }
    });

    ws.on('close', () => {
        players = players.filter(p => p.ws !== ws);
        console.log(`Jugador desconectado. Total: ${players.length}`);
        gameState = null;
        broadcast({ type: 'opponentLeft' });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor con tablero dinámico corriendo en http://localhost:${PORT}`);
});