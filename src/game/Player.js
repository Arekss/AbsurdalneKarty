class Player {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.hand = []; // Holds the player's answer cards for each round
    this.score = 0; // Track the player's score
  }

  addCard(card) {
    if (this.hand.length < 5) {
      this.hand.push(card); // Add a card to the player's hand if there's room
    }
  }

  removeCard(card) {
    const cardIndex = this.hand.indexOf(card);
    if (cardIndex > -1) {
      const removedCard = this.hand.splice(cardIndex, 1)[0]; // Remove and return the card
      console.log(`Card "${removedCard}" successfully removed.`);
      //return removedCard; // uncomment if cards should land in reusable pool
    } else {
      console.log(`Card "${card}" not found in hand.`);
     // return undefined;
    }
  }
  

  incrementScore() {
    console.log("IMPORTANT2: cards hand: ", this.hand);
    this.score += 1; // Increment the player's score by 1
  }

  resetHand() {
    this.hand = []; // Clear the player's hand for the next round
  }

  getInfo() {
    // Return essential information about the player
    return {
      name: this.name,
      id: this.id,
      hand: this.hand,
      score: this.score,
    };
  }
}

module.exports = Player;
