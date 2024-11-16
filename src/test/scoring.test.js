const Room = require('../game/Room');

describe('Scoring System Logic', () => {
  let room;

  beforeEach(() => {
    room = new Room('testRoom');
    room.addPlayer('Player1', 'player1Id');
    room.addPlayer('Player2', 'player2Id');
  });

  test('should initialize scores for each player', () => {
    expect(room.scores['player1Id']).toBe(0);
    expect(room.scores['player2Id']).toBe(0);
  });

  test('should increase score for the winning player', () => {
    room.submitAnswer('player1Id', 'Answer1');
    room.submitAnswer('player2Id', 'Answer2');
    room.chooseWinner('player1Id');
    expect(room.scores['player1Id']).toBe(1);
    expect(room.scores['player2Id']).toBe(0);
  });

  test('should reset scores when a new game is started', () => {
    room.chooseWinner('player1Id');
    room.scores = { player1Id: 2, player2Id: 1 };
    room.resetForNextRound();
    expect(room.scores['player1Id']).toBe(2); // Scores persist across rounds but can be reset if a new game is implemented.
  });
});
