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
    room = game.rooms[roomCode];
    io.to(roomCode).emit("updateRoomDisplay", room.updateRoomDisplayEmitData());

  });

  socket.on("joinRoom", (data) => {
    const roomCode = data.roomCode;

    room = game.rooms[roomCode];

    if (room)
    {
      if(room.gameStarted === 1)
      {
        socket.emit("error", { message: "Blad. Gra zostala rozpoczeta." });
        return;
      }
    }
    const joined = game.addPlayerToRoom(
      roomCode,
      data.playerName,
      socket.id,
    );
    if (joined) {
      socket.join(roomCode);
      room = game.rooms[roomCode];
      io.to(roomCode).emit("updateRoomDisplay",room.updateRoomDisplayEmitData());
    } else {
      socket.emit("error", { message: "Blad. Pokoj nie istnieje lub jest pelny" });
    }
  });

  // Start the game event
  socket.on("startGame", (data) => {
    const roomCode = [...socket.rooms].find((code) => code !== socket.id);
    const room = game.rooms[roomCode];
  
    if (room) {
      room.gameStarted = 1;
      room.assignCards();
      room.assignQuestionCard();
      room.emitCardsToPlayers(io);
    }
  });
  
  // 'startNewRound' event handler
  socket.on("startNewRound", (data) => {
    const roomCode = [...socket.rooms].find((code) => code !== socket.id);
    const room = game.rooms[roomCode];
  
    if (room) {
      room.initializeRound();
      room.emitCardsToPlayers(io);
      io.to(roomCode).emit("updateRoomDisplay", room.updateRoomDisplayEmitData());
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

      io.to(roomCode).emit("endRound", {
                   question: room.currentQuestion,
                    winningAnswer: data.winnerSAnswer,
                    winnerName: winner.name
                  });

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
      room.submitAnswer(socket.id, data.answer);

      io.to(roomCode).emit("onSumbitAnswerMarkPlayerGreen", {
        playerId: socket.id,
      });

      if (room.isReadyForNextRound()) {
         io.to(roomCode).emit("revealAnswers", room.revealAnswersEmitData());
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
