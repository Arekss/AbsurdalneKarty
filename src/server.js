const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Game = require("./game/Game");
const Room = require("./game/Room");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.static("public"));

const game = new Game(io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("createRoom", (data) => {
    const roomCode = game.createRoom(data.playerName, socket.id);
    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode });
    io.to(roomCode).emit("updateRoomDisplay", game.getRoomState(roomCode));
  });

  socket.on("joinRoom", (data) => {
    const joined = game.addPlayerToRoom(
      data.roomCode,
      data.playerName,
      socket.id,
    );
    if (joined) {
      socket.join(data.roomCode);
      io.to(data.roomCode).emit("updateRoomDisplay", game.getRoomState(data.roomCode));
    } else {
      socket.emit("error", { message: "Room not found or full" });
    }
  });

  // Start the game event
  socket.on("startGame", (data) => {
    const roomCode = [...socket.rooms].find((code) => code !== socket.id);
    const room = game.rooms[roomCode];

    if (room) {
      room.assignCards();
      room.assignQuestionCard();

      // Emit the question and each player's answer cards
      room.players.forEach((player) => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit("updateAndDisplayCards", {
            question: room.currentQuestion,
            roundMaster: room.roundMaster,
            hand: player.hand, // Emit the player's specific hand of answer cards
          });
        }
      });
    }
  });

  
  socket.on("startNewRound", (data) => {
    console.log("start of startNewRound  ");
    const roomCode = [...socket.rooms].find((code) => code !== socket.id);
    const room = game.rooms[roomCode];
    if (room){
      room.initializeRound();

      room.players.forEach((player) => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit("updateAndDisplayCards", {
            question: room.currentQuestion,
            roundMaster: room.roundMaster,
            hand: player.hand, // Emit the player's specific hand of answer cards
          });
          console.log("startNewRound for player ", player.name);
        }
      });

      io.to(roomCode).emit("updateRoomDisplay", game.getRoomState(roomCode));
    }
  });

  // Round master chooses the funniest answer
  socket.on("chooseWinner", (data, callback) => {
    const roomCode = [...socket.rooms].find((code) => code !== socket.id);
    const room = game.rooms[roomCode];
    if (room && room.roundMaster === socket.id) {
      const winner = room.players.find((player) => player.id === data.winnerId);
      if (winner) {
        winner.incrementScore();
        console.log(winner.name);
  
        // Invoke the callback with a success response
        return callback({ success: true });
      }
    }
  
    // If something went wrong, invoke the callback with a failure response
    callback({ success: false, message: "Invalid room or winner" });
  });

  // Player submits an answer
  socket.on("submitAnswer", (data) => {
    const roomCode = [...socket.rooms].find((code) => code !== socket.id);
    const room = game.rooms[roomCode];
    if (room) {
      console.log("IMPORTANT: answer: ", data.answer);
      room.submitAnswer(socket.id, data.answer);
      console.log(room.getState().answers);

      io.to(roomCode).emit("onSumbitAnswerMarkPlayerGreen", {
        playerId: socket.id,
      });

      if (room.isReadyForNextRound()) {
        io.to(roomCode).emit("revealAnswers", {
          question: room.currentQuestion,
          answers: room.getState().answers,
          roundMaster: room.roundMaster,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    game.removePlayer(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
