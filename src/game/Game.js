const Room = require("./Room");

class Game {
  constructor(io) {
    this.io = io;
    this.rooms = {};
  }

  createRoom(playerName, playerId) {
    const roomCode = this.generateRoomCode();
    const room = new Room(roomCode);
    room.addPlayer(playerName, playerId);
    this.rooms[roomCode] = room;
    return roomCode;
  }

  addPlayerToRoom(roomCode, playerName, playerId) {
    const room = this.rooms[roomCode];
    if (room && room.players.length < 10) {
      // Maximum of 10 players per room
      room.addPlayer(playerName, playerId);
      return true;
    }
    return false;
  }

  submitAnswer(roomCode, playerId, answer) {
    const room = this.rooms[roomCode];
    if (room) {
      room.submitAnswer(playerId, answer);
      if (room.allAnswersSubmitted()) {
        this.startNextStage(roomCode);
      }
    }
  }

  chooseWinner(roomCode, playerId, winnerId) {
    const room = this.rooms[roomCode];
    if (room && room.isRoundMaster(playerId)) {
      room.chooseWinner(winnerId);
      this.startNextRound(roomCode);
    }
  }

  removePlayer(playerId) {
    for (const roomCode in this.rooms) {
      const room = this.rooms[roomCode];
      room.removePlayer(playerId);
      if (room.isEmpty()) {
        delete this.rooms[roomCode];
        console.log("Room deleted. Current number of rooms:", Object.keys(this.rooms).length);
      }
    }
  }

  getRoomState(roomCode) {
    const room = this.rooms[roomCode];
    return room ? room.getState() : null;
  }

  startNextStage(roomCode) {
    const room = this.rooms[roomCode];
    if (room) {
      this.io
        .to(roomCode)
        .emit("startChoosing", { roundMaster: room.roundMaster });
    }
  }

  startNextRound(roomCode) {
    const room = this.rooms[roomCode];
    if (room) {
      room.resetForNextRound();
      this.io.to(roomCode).emit("newRound", room.getState());
    }
  }

  generateRoomCode() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let roomCode = "";
    for (let i = 0; i < 5; i++) {
      roomCode += letters[Math.floor(Math.random() * letters.length)];
    }
    return roomCode;
  }

}

module.exports = Game;
