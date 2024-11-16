const Game = require('../game/Game');

describe('Game State Management', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  test('should create a room with a unique code', () => {
    const roomCode = game.createRoom('Player1', 'player1Id');
    expect(roomCode).toBeDefined();
    expect(game.rooms[roomCode]).toBeDefined();
  });

  test('should add a player to an existing room', () => {
    const roomCode = game.createRoom('Player1', 'player1Id');
    const added = game.addPlayerToRoom(roomCode, 'Player2', 'player2Id');
    expect(added).toBe(true);
    expect(game.rooms[roomCode].players.length).toBe(2);
  });

  test('should not add a player to a non-existent room', () => {
    const added = game.addPlayerToRoom('nonexistent', 'Player2', 'player2Id');
    expect(added).toBe(false);
  });

  test('should remove a player from the game', () => {
    const roomCode = game.createRoom('Player1', 'player1Id');
    game.addPlayerToRoom(roomCode, 'Player2', 'player2Id');
    game.removePlayer('player2Id');
    expect(game.rooms[roomCode].players.length).toBe(1);
  });
});
