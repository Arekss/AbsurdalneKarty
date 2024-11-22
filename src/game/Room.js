const fs = require("fs");
const path = require("path");
const Player = require("./Player");

class Room {
  constructor(roomCode) {
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
    console.log("answer cards current pool size :", this.answerCards.length);
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

  submitAnswer(playerId, answer) {
    // Check if the player has already submitted an answer
    const existingAnswer = this.answers.find((a) => a.playerId === playerId);
    if (!existingAnswer) {
      this.answers.push({ playerId, answer }); // Add new answer
      const player = this.players.find((p) => p.id === playerId);
      player.removeCard(answer);
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
}

module.exports = Room;
