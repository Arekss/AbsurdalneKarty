const Player = require('../game/Player');

describe('Player Class', () => {
  let player;

  beforeEach(() => {
    player = new Player('TestPlayer', 'testPlayerId');
  });

  test('should initialize with a name and ID', () => {
    expect(player.name).toBe('TestPlayer');
    expect(player.id).toBe('testPlayerId');
  });

  test('should return player info correctly', () => {
    const info = player.getInfo();
    expect(info).toEqual({
      name: 'TestPlayer',
      id: 'testPlayerId'
    });
  });
});
