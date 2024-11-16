const Room = require('../game/Room');

describe('Room Logic', () => {
  let room;

  beforeEach(() => {
    room = new Room('testRoom');
  });

  test('should add a player to the room', () => {
    room.addPlayer('Player1', 'player1Id');
    expect(room.players.length).toBe(1);
    expect(room.players[0].name).toBe('Player1');
  });

  test('should remove a player from the room', () => {
    room.addPlayer('Player1', 'player1Id');
    room.addPlayer('Player2', 'player2Id');
    room.removePlayer('player1Id');
    expect(room.players.length).toBe(1);
    expect(room.players[0].name).toBe('Player2');
  });

  test('should return true when all players have submitted answers', () => {
    room.addPlayer('Player1', 'player1Id');
    room.addPlayer('Player2', 'player2Id');
    room.submitAnswer('player1Id', 'Answer1');
    room.submitAnswer('player2Id', 'Answer2');
    expect(room.allAnswersSubmitted()).toBe(true);
  });

  test('should reset room for the next round', () => {
    room.addPlayer('Player1', 'player1Id');
    room.addPlayer('Player2', 'player2Id');
    room.submitAnswer('player1Id', 'Answer1');
    room.submitAnswer('player2Id', 'Answer2');
    room.resetForNextRound();
    expect(room.answers).toEqual({});
  });
});
