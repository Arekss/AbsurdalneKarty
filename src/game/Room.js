const fs = require("fs");
const path = require("path");
const Player = require("./Player");

class Room {
  constructor(roomCode) {
    this.gameStarted = 0;
    this.roomCode = roomCode;
    this.players = [];
    this.answers = [];
    this.roundMaster = null;
    this.currentQuestion = null;
    this.scores = {};
    const cards = this.loadCards();
    this.questions = this.shuffleArray([...cards.questions]); // Shuffle at creation
    this.answerCards = this.shuffleArray([...cards.answers]); // Shuffle at creation
  }

  loadCards() {
    const cardsPath = path.join(__dirname, "../data/cards.json");
    return JSON.parse(fs.readFileSync(cardsPath, "utf8"));
  }

  shuffleArray(array) {
    // Shuffle array in-place using Fisher-Yates algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  addPlayer(playerName, playerId) {
    const player = new Player(playerName, playerId);
    this.players.push(player);
    this.scores[playerId] = 0;
    if (!this.roundMaster) {
      this.roundMaster = playerId; // Set the first player as round master
    }
  }

  initializeRound() {
    this.assignCards();
    this.assignQuestionCard();
    this.answers = [];
    this.roundMaster = this.getNextRoundMaster(); // Update round master each round
  }

  assignCards() {
    // Ensure each player has 5 cards by assigning from end of shuffled answerCards array
    this.players.forEach((player) => {
      while (player.hand.length < 5 && this.answerCards.length > 0) {
        player.hand.push(this.answerCards.pop()); // Assign last element and remove it
      }
    });
    this.checkPoolSize();
  }

  assignQuestionCard() {
    if (this.questions.length > 0) {
      this.currentQuestion = this.questions.pop(); // Assign last question and remove it
    } else {
      console.warn("No more questions available in pool");
    }
    this.checkPoolSize();
  }

  getNextRoundMaster() {
    const currentIndex = this.players.findIndex(
      (player) => player.id === this.roundMaster,
    );
    return this.players[(currentIndex + 1) % this.players.length].id;
  }



  rerollCards(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    // Sprawdź, czy gracz istnieje
    if (!player) {
      console.error(`Player of ID ${playerId} does not exist`);
      return;
    }
  
    this.answerCards.push(...player.hand);
    player.resetHand();
    this.answerCards = this.shuffleArray(this.answerCards);
    const newCards = this.answerCards.splice(0, 5);
    player.assignRerolledCards(newCards);
  }

  submitAnswer(playerId, answer) {
    // Check if the player has already submitted an answer
    const existingAnswer = this.answers.find((a) => a.playerId === playerId);
    if (!existingAnswer) {
      this.answers.push({ playerId, answer }); // Add new answer
      const player = this.players.find((p) => p.id === playerId);
      player.removeCard(answer);
      this.rerollCards(playerId);
    }
  }

  

  chooseWinner(winnerId) {
    if (this.answers[winnerId]) {
      this.scores[winnerId] += 1;
    }
    this.answers = {}; // Clear answers for the next round
  }

  getState() {
    return {
      roomCode: this.roomCode,
      players: this.players.map((player) => ({
        name: player.name,
        id: player.id,
        hand: player.hand,
      })),
      roundMaster: this.roundMaster,
      scores: this.scores,
      question: this.currentQuestion,
      answers: this.answers,
    };
  }

  getPlayerState(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    return {
      hand: player.hand,
      roundMaster: this.roundMaster,
      scores: this.scores,
      question: this.currentQuestion,
    };
  }

  isReadyForNextRound() {
    return this.answers.length === this.players.length - 1; // Assuming round master doesn't submit an answer
  }

  isEmpty() {
    return this.players.length === 0;
  }

  removePlayer(playerId) {
    this.players = this.players.filter((player) => player.id !== playerId);
    delete this.scores[playerId];
    delete this.answers[playerId];

    if (this.roundMaster === playerId) {
      this.roundMaster = this.players.length ? this.players[0].id : null;
    }
  }

  checkPoolSize() {
    const questionThreshold = Math.ceil(this.questions.length * 0.1);
    const answerThreshold = Math.ceil(this.answerCards.length * 0.1);
    if (this.questions.length < questionThreshold) {
      console.warn("Warning: Less than 10% of questions remaining in pool");
    }
    if (this.answerCards.length < answerThreshold) {
      console.warn("Warning: Less than 10% of answers remaining in pool");
    }
  }


  emitCardsToPlayers(io) {
    this.players.forEach((player) => {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit("updateAndDisplayCards", {
          question: this.currentQuestion,
          roundMaster: this.roundMaster,
          hand: player.hand, // Emit the player's specific hand of answer cards
        });
      }
    });
  }

  revealAnswersEmitData()
  {
    const data = {
      question: this.currentQuestion,
      answers: this.answers,
      roundMaster: this.roundMaster,
    }
    return data;
  }
  
  updateRoomDisplayEmitData()
  {
    const data = {
      players: this.players,
      currentQuestion: this.currentQuestion,
      roundMaster: this.roundMaster,
      roomCode: this.roomCode,
      numOfQuestions: this.questions.length,
      numOfAnswers: this.answerCards.length
    }
    return data;
  }

}

module.exports = Room;
