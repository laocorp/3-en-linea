<<<<<<< HEAD
// server.js - VERSIÓN FINAL CON TURNO INICIAL ALEATORIO
=======
// server.js - VERSIÓN FINAL CON MENSAJES ESTANDARIZADOS
>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

let players = [];
let gameState = null;

function createNewGameState(size) {
    let winCondition = size > 4 ? 5 : (size === 4 ? 4 : 3);
    return {
        size, winCondition,
<<<<<<< HEAD
        playersInfo: { X: { name: null, connected: false }, O: { name: null, connected: false } },
        board: Array(size * size).fill(null),
        // --- CAMBIO CLAVE AQUÍ ---
        // Se elige aleatoriamente quién empieza. Math.random() < 0.5 da un 50% de probabilidad.
        currentPlayer: Math.random() < 0.5 ? 'X' : 'O',
        gameActive: true,
        scores: { X: 0, O: 0 },
        isAIGame: false,
        lastMoveIndex: null
    };
}

function checkWin(board, size, winCondition) {
    const getCell = (r, c) => r * size + c;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const player = board[getCell(r, c)];
            if (!player) continue;
            if (c <= size - winCondition && Array.from({length: winCondition}, (_, i) => board[getCell(r, c + i)]).every(p => p === player)) return player;
            if (r <= size - winCondition && Array.from({length: winCondition}, (_, i) => board[getCell(r + i, c)]).every(p => p === player)) return player;
            if (r <= size - winCondition && c <= size - winCondition && Array.from({length: winCondition}, (_, i) => board[getCell(r + i, c + i)]).every(p => p === player)) return player;
            if (r <= size - winCondition && c >= winCondition - 1 && Array.from({length: winCondition}, (_, i) => board[getCell(r + i, c - i)]).every(p => p === player)) return player;
        }
    }
    if (!board.includes(null)) return 'draw';
    return null;
}

function broadcast(data) {
    players.forEach(player => {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(data));
        }
    });
}

const scores = { 'X': -10, 'O': 10, 'draw': 0 };

function minimax(board, isMaximizing) {
    const winner = checkWin(board, gameState.size, gameState.winCondition);
    if (winner !== null) {
        return scores[winner];
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                let score = minimax(board, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function makeAIMove() {
    if (!gameState || !gameState.gameActive || gameState.currentPlayer !== 'O') return;

    setTimeout(() => {
        let bestScore = -Infinity;
        let bestMove;

        for (let i = 0; i < gameState.board.length; i++) {
            if (gameState.board[i] === null) {
                gameState.board[i] = 'O';
                let score = minimax(gameState.board, false);
                gameState.board[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        gameState.board[bestMove] = 'O';
        gameState.lastMoveIndex = bestMove;
        
        const winnerSymbol = checkWin(gameState.board, gameState.size, gameState.winCondition);
        if (winnerSymbol) {
            gameState.gameActive = false;
            gameState.scores[winnerSymbol]++;
            broadcast({ type: 'gameOver', payload: { winnerSymbol, gameState } });
        } else {
            gameState.currentPlayer = 'X';
            broadcast({ type: 'update', payload: { gameState } });
        }
    }, 750);
=======
        playersInfo: { X: { id: null, name: null, connected: false }, O: { id: null, name: null, connected: false } },
        board: Array(size * size).fill(null),
        currentPlayer: 'X',
        gameActive: true,
        scores: { X: 0, O: 0 },
        lastMoveIndex: null
    };
}

function checkWin(board, size, winCondition) {
    const getCell = (r, c) => r * size + c;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const player = board[getCell(r, c)];
            if (!player) continue;
            if (c <= size - winCondition && Array.from({length: winCondition}, (_, i) => board[getCell(r, c + i)]).every(p => p === player)) return player;
            if (r <= size - winCondition && Array.from({length: winCondition}, (_, i) => board[getCell(r + i, c)]).every(p => p === player)) return player;
            if (r <= size - winCondition && c <= size - winCondition && Array.from({length: winCondition}, (_, i) => board[getCell(r + i, c + i)]).every(p => p === player)) return player;
            if (r <= size - winCondition && c >= winCondition - 1 && Array.from({length: winCondition}, (_, i) => board[getCell(r + i, c - i)]).every(p => p === player)) return player;
        }
    }
    return null;
}

function broadcast(data) {
    players.forEach(player => {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(data));
        }
    });
>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
}

function resetGame() {
    if (!gameState) return;
    const oldScores = gameState.scores;
    const oldPlayerNames = gameState.playersInfo;
    const size = gameState.size;
<<<<<<< HEAD
    const isAIGame = gameState.isAIGame;

    gameState = createNewGameState(size); // La aleatoriedad ocurre aquí
    gameState.scores = oldScores;
    gameState.playersInfo = oldPlayerNames;
    gameState.isAIGame = isAIGame;
=======
    
    gameState = createNewGameState(size);
    gameState.scores = oldScores;
    gameState.playersInfo = oldPlayerNames;
>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
    
    broadcast({ type: 'update', payload: { gameState } });
}

wss.on('connection', ws => {
    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            const { type, payload } = data;
<<<<<<< HEAD
            
            if (type === 'startGameAI') {
                players = [{ ws, symbol: 'X' }];
                gameState = createNewGameState(payload.size); // La aleatoriedad ocurre aquí
                gameState.isAIGame = true;
                gameState.playersInfo.X = { name: payload.name, connected: true };
                gameState.playersInfo.O = { name: 'Computadora', connected: true };
                
                ws.send(JSON.stringify({ type: 'assignSymbol', payload: { symbol: 'X' } }));
                broadcast({ type: 'update', payload: { gameState } });

                // Si la IA empieza, debe hacer su movimiento
                if (gameState.currentPlayer === 'O') {
                    makeAIMove();
                }
                return;
            }

            if (type === 'join') {
                if (players.length >= 2) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'La partida ya está llena.' } }));
                    return;
                }
                const player = { ws, symbol: players.length === 0 ? 'X' : 'O' };
                players.push(player);

                if (!gameState) {
                    gameState = createNewGameState(payload.size); // La aleatoriedad ocurre aquí
                }
                gameState.playersInfo[player.symbol] = { name: payload.name, connected: true };
                ws.send(JSON.stringify({ type: 'assignSymbol', payload: { symbol: player.symbol } }));
                broadcast({ type: 'update', payload: { gameState } });
            }

=======

            if (type === 'join') {
                if (players.length >= 2) {
                    // CORREGIDO: El mensaje de error ahora usa 'payload'
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'La partida ya está llena.' } }));
                    return;
                }
                const playerId = uuidv4();
                const symbol = players.length === 0 ? 'X' : 'O';
                const player = { ws, playerId, symbol };
                players.push(player);

                if (!gameState) {
                    gameState = createNewGameState(payload.size);
                }
                
                gameState.playersInfo[symbol] = { id: playerId, name: payload.name, connected: true };
                
                ws.send(JSON.stringify({ type: 'assignIdentity', payload: { symbol, playerId } }));
                broadcast({ type: 'update', payload: { gameState } });
            }

            if (type === 'reconnect') {
                const { playerId } = payload;
                const playerToReconnect = players.find(p => p.playerId === playerId);

                if (playerToReconnect && gameState) {
                    playerToReconnect.ws = ws;
                    gameState.playersInfo[playerToReconnect.symbol].connected = true;
                    
                    if (playerToReconnect.disconnectTimer) {
                        clearTimeout(playerToReconnect.disconnectTimer);
                        playerToReconnect.disconnectTimer = null;
                    }
                    
                    console.log(`Jugador ${gameState.playersInfo[playerToReconnect.symbol].name} reconectado.`);
                    broadcast({ type: 'update', payload: { gameState } });
                } else {
                    // CORREGIDO: El mensaje de error ahora usa 'payload'
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'No se pudo reconectar. Empezando de nuevo.' } }));
                }
            }

>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
            const player = players.find(p => p.ws === ws);
            if (!player) return;

            if (type === 'move' && gameState && gameState.gameActive && player.symbol === gameState.currentPlayer) {
                if (gameState.board[payload.index] === null) {
                    gameState.board[payload.index] = gameState.currentPlayer;
                    gameState.lastMoveIndex = payload.index;
                    const winnerSymbol = checkWin(gameState.board, gameState.size, gameState.winCondition);

                    if (winnerSymbol) {
                        gameState.gameActive = false;
                        gameState.scores[winnerSymbol]++;
                        broadcast({ type: 'gameOver', payload: { winnerSymbol, gameState } });
<<<<<<< HEAD
                    } else {
                        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
                        broadcast({ type: 'update', payload: { gameState } });
                        
                        if (gameState.isAIGame && gameState.currentPlayer === 'O') {
                            makeAIMove();
                        }
=======
                    } else if (!gameState.board.includes(null)) {
                        gameState.gameActive = false;
                        broadcast({ type: 'gameOver', payload: { winnerSymbol: 'draw', gameState } });
                    } else {
                        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
                        broadcast({ type: 'update', payload: { gameState } });
>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
                    }
                }
            }
            
            if (type === 'reset') {
<<<<<<< HEAD
                 if (gameState) {
                    resetGame();
                    if (gameState.isAIGame && gameState.currentPlayer === 'O') {
                        makeAIMove();
                    }
                }
            }
=======
                if(players.length === 2 && gameState) resetGame();
            }

>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
        } catch (error) {
            console.error("Error procesando mensaje:", error);
        }
    });

    ws.on('close', () => {
<<<<<<< HEAD
        players = players.filter(p => p.ws !== ws);
        if (players.length < 2 && gameState && !gameState.isAIGame) {
            gameState = null;
            broadcast({ type: 'opponentLeft' });
        } else if (players.length < 1 && gameState && gameState.isAIGame) {
            gameState = null;
        }
        console.log(`Jugador desconectado. Total: ${players.length}`);
=======
        const disconnectedPlayer = players.find(p => p.ws === ws);
        if (!disconnectedPlayer) return;

        console.log(`Jugador ${disconnectedPlayer.playerId} desconectado temporalmente.`);
        if (gameState) {
            gameState.playersInfo[disconnectedPlayer.symbol].connected = false;
            broadcast({ type: 'opponentDisconnected', payload: { gameState } });
            
            disconnectedPlayer.disconnectTimer = setTimeout(() => {
                if(gameState && !gameState.playersInfo[disconnectedPlayer.symbol].connected) {
                    console.log(`Período de gracia terminado para ${disconnectedPlayer.playerId}. Terminando partida.`);
                    // CORREGIDO: El mensaje de fin de partida ahora usa 'payload'
                    broadcast({ type: 'gameEnded', payload: { message: 'El oponente no se reconectó a tiempo.' } });
                    players = [];
                    gameState = null;
                }
            }, 15000);
        }
>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
    });
});

const PORT = 3000;
server.listen(PORT, () => {
<<<<<<< HEAD
    console.log(`🚀 Servidor con turno aleatorio corriendo en http://localhost:${PORT}`);
=======
    console.log(`🚀 Servidor con reconexión corriendo en http://localhost:${PORT}`);
>>>>>>> 8b27bcac5e6d909d96a92ebe232ececa4ea6eff0
});