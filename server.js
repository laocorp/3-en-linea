// server.js - VERSIÓN OPTIMIZADA CON CLASE GAME
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

/**
 * La clase Game encapsula toda la lógica y el estado de una partida.
 */
class Game {
    constructor() {
        this.players = [];
        this.gameState = null;
        console.log("Nueva instancia de juego creada. Esperando jugadores.");
    }

    // --- Métodos de Gestión de Jugadores ---

    addPlayer(ws) {
        if (this.players.length >= 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'La partida ya está llena.' }));
            ws.close();
            return null;
        }
        const player = {
            ws,
            playerId: uuidv4(),
            symbol: this.players.length === 0 ? 'X' : 'O'
        };
        this.players.push(player);
        console.log(`Jugador ${player.playerId} conectado como ${player.symbol}. Total: ${this.players.length}`);
        return player;
    }

    removePlayer(ws) {
        const disconnectedPlayer = this.players.find(p => p.ws === ws);
        if (!disconnectedPlayer) return;

        console.log(`Jugador ${disconnectedPlayer.playerId} desconectado.`);
        this.players = this.players.filter(p => p.ws !== ws);

        if (this.players.length < 2) {
            this.gameState = null; // Resetea el juego por completo.
            this.broadcast({ type: 'opponentLeft' });
            console.log("Partida terminada por desconexión.");
        }
    }

    findPlayer(ws) {
        return this.players.find(p => p.ws === ws);
    }
    
    broadcast(data) {
        this.players.forEach(player => {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(data));
            }
        });
    }

    // --- Métodos de Lógica del Juego ---

    handleMessage(ws, data) {
        const player = this.findPlayer(ws);
        if (!player) return;

        const { type, payload } = data;

        switch (type) {
            case 'join':
                this._handleJoin(player, payload);
                break;
            case 'move':
                this._handleMove(player, payload);
                break;
            case 'reset':
                this._handleReset();
                break;
        }
    }

    _handleJoin(player, payload) {
        if (!this.gameState) {
            this.gameState = this._createNewGameState(payload.size);
        }
        this.gameState.playersInfo[player.symbol] = { id: player.playerId, name: payload.name, connected: true };
        player.ws.send(JSON.stringify({ type: 'assignIdentity', payload: { symbol: player.symbol, playerId: player.playerId } }));
        this.broadcast({ type: 'update', payload: { gameState: this.gameState } });
    }

    _handleMove(player, payload) {
        if (!this.gameState || !this.gameState.gameActive || player.symbol !== this.gameState.currentPlayer) return;
        if (this.gameState.board[payload.index] !== null) return;

        this.gameState.board[payload.index] = this.gameState.currentPlayer;
        const winnerSymbol = this._checkWin();

        if (winnerSymbol) {
            this.gameState.gameActive = false;
            this.gameState.scores[winnerSymbol]++;
            this.broadcast({ type: 'gameOver', payload: { winnerSymbol, gameState: this.gameState } });
        } else if (!this.gameState.board.includes(null)) {
            this.gameState.gameActive = false;
            this.broadcast({ type: 'gameOver', payload: { winnerSymbol: 'draw', gameState: this.gameState } });
        } else {
            this.gameState.currentPlayer = this.gameState.currentPlayer === 'X' ? 'O' : 'X';
            this.broadcast({ type: 'update', payload: { gameState: this.gameState } });
        }
    }
    
    _handleReset() {
        if (!this.gameState || this.players.length < 2) return;
        const oldScores = this.gameState.scores;
        const oldPlayerNames = this.gameState.playersInfo;
        const size = this.gameState.size;
        
        this.gameState = this._createNewGameState(size);
        this.gameState.scores = oldScores;
        this.gameState.playersInfo = oldPlayerNames;
        this.broadcast({ type: 'update', payload: { gameState: this.gameState } });
    }

    _createNewGameState(size) {
        let winCondition = size > 4 ? 5 : (size === 4 ? 4 : 3);
        return {
            size, winCondition,
            playersInfo: { X: { id: null, name: null, connected: false }, O: { id: null, name: null, connected: false } },
            board: Array(size * size).fill(null),
            currentPlayer: 'X',
            gameActive: true,
            scores: { X: 0, O: 0 }
        };
    }
    
    _checkWin() {
        const { board, size, winCondition } = this.gameState;
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
}

// Creamos una única instancia de nuestro juego.
const game = new Game();

wss.on('connection', ws => {
    const player = game.addPlayer(ws);

    ws.on('message', message => {
        try {
            game.handleMessage(ws, JSON.parse(message));
        } catch (error) {
            console.error("Error procesando mensaje:", error);
        }
    });

    ws.on('close', () => {
        game.removePlayer(ws);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor optimizado corriendo en http://localhost:${PORT}`);
});