const Room = require('../game/Room');

describe('Answer Selection Logic', () => {
  let room;

  beforeEach(() => {
    room = new Room('testRoom');
    room.addPlayer('Player1', 'player1Id');
    room.addPlayer('Player2', 'player2Id');
  });

  test('should allow players to submit answers', () => {
    room.submitAnswer('player1Id', 'Answer1');
    expect(room.answers['player1Id']).toBe('Answer1');
  });

  test('should detect when all answers are submitted', () => {
    room.submitAnswer('player1Id', 'Answer1');
    room.submitAnswer('player2Id', 'Answer2');
    expect(room.allAnswersSubmitted()).toBe(true);
  });

  test('should handle cases when a player does not submit in time', () => {
    room.submitAnswer('player1Id', 'Answer1');
    expect(room.allAnswersSubmitted()).toBe(false);
  });
});
