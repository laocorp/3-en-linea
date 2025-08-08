// server.js - VERSIÓN FINAL CON LÍNEA GANADORA
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
        playersInfo: { X: { name: null, connected: false }, O: { name: null, connected: false } },
        board: Array(size * size).fill(null),
        currentPlayer: 'X',
        gameActive: true,
        scores: { X: 0, O: 0 }
    };
}

function checkWin(board, size, winCondition) {
    // Para la animación, solo calcularemos la línea específica para 3x3
    if (size === 3) {
        const lines3x3 = [
            { id: 'win-row-0', indexes: [0, 1, 2] }, { id: 'win-row-1', indexes: [3, 4, 5] }, { id: 'win-row-2', indexes: [6, 7, 8] },
            { id: 'win-col-0', indexes: [0, 3, 6] }, { id: 'win-col-1', indexes: [1, 4, 7] }, { id: 'win-col-2', indexes: [2, 5, 8] },
            { id: 'win-diag-0', indexes: [0, 4, 8] }, { id: 'win-diag-1', indexes: [2, 4, 6] }
        ];
        for (const line of lines3x3) {
            const [a, b, c] = line.indexes;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], lineId: line.id }; // Retorna objeto con ganador y línea
            }
        }
    }

    // Para otros tamaños, solo detectamos al ganador sin la línea visual
    const winnerSymbol = checkWinDynamic(board, size, winCondition);
    if (winnerSymbol) return { winner: winnerSymbol, lineId: null };

    return null; // No hay ganador
}

function checkWinDynamic(board, size, winCondition) {
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
    players.forEach(p => { if (p.ws.readyState === WebSocket.OPEN) p.ws.send(JSON.stringify(data)) });
}

function resetGame() {
    if (!gameState) return;
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
    const player = { ws, symbol: players.length === 0 ? 'X' : 'O' };
    players.push(player);

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            const { type, payload } = data;

            if (type === 'join') {
                if (!gameState) {
                    gameState = createNewGameState(payload.size);
                }
                gameState.playersInfo[player.symbol] = { name: payload.name, connected: true };
                ws.send(JSON.stringify({ type: 'assignSymbol', payload: { symbol: player.symbol } }));
                broadcast({ type: 'update', payload: { gameState } });
            }

            if (type === 'move') {
                if (!gameState || !gameState.gameActive || player.symbol !== gameState.currentPlayer) return;
                if (gameState.board[payload.index] === null) {
                    gameState.board[payload.index] = gameState.currentPlayer;
                    const result = checkWin(gameState.board, gameState.size, gameState.winCondition);

                    if (result) {
                        gameState.gameActive = false;
                        gameState.scores[result.winner]++;
                        broadcast({ type: 'gameOver', payload: { winnerSymbol: result.winner, winningLineId: result.lineId, gameState } });
                    } else if (!gameState.board.includes(null)) {
                        gameState.gameActive = false;
                        broadcast({ type: 'gameOver', payload: { winnerSymbol: 'draw', gameState } });
                    } else {
                        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
                        broadcast({ type: 'update', payload: { gameState } });
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
        gameState = null;
        broadcast({ type: 'opponentLeft' });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor con línea ganadora corriendo en http://localhost:${PORT}`);
});