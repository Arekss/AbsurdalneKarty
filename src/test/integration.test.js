const io = require('socket.io-client');
const http = require('http');
const Server = require('socket.io');
const Game = require('../game/Game');

describe('Cards Against Humanity Game - Room Creation and Joining', () => {
  let ioServer;
  let httpServer;
  let game;

  beforeAll((done) => {
    httpServer = http.createServer();
    ioServer = new Server(httpServer);
    game = new Game(ioServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      ioServer.on('connection', (socket) => {
        socket.on('createRoom', (data) => {
          const roomCode = game.createRoom(data.playerName, socket.id);
          socket.join(roomCode);
          socket.emit('roomCreated', { roomCode });
        });

        socket.on('joinRoom', (data) => {
          const joined = game.addPlayerToRoom(data.roomCode, data.playerName, socket.id);
          if (joined) {
            socket.join(data.roomCode);
            ioServer.to(data.roomCode).emit('updateRoomDisplay', game.getRoomState(data.roomCode));
          } else {
            socket.emit('error', { message: 'Room not found or full' });
          }
        });
      });
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  test('should create a room and emit roomCreated event', (done) => {
    const clientSocket = io.connect(`http://localhost:${httpServer.address().port}`);
    clientSocket.on('connect', () => {
      clientSocket.emit('createRoom', { playerName: 'Player1' });
    });

    clientSocket.on('roomCreated', (data) => {
      expect(data.roomCode).toBeDefined();
      expect(game.rooms[data.roomCode]).toBeDefined();
      clientSocket.disconnect();
      done();
    });
  });

  test('should allow another player to join the created room and emit updateRoomDisplay event', (done) => {
    const clientSocket1 = io.connect(`http://localhost:${httpServer.address().port}`);
    const clientSocket2 = io.connect(`http://localhost:${httpServer.address().port}`);
    let roomCode;

    clientSocket1.on('connect', () => {
      clientSocket1.emit('createRoom', { playerName: 'Player1' });
    });

    clientSocket1.on('roomCreated', (data) => {
      roomCode = data.roomCode;
      clientSocket2.emit('joinRoom', { roomCode, playerName: 'Player2' });
    });

    clientSocket2.on('updateRoomDisplay', (data) => {
      expect(data.roomCode).toBe(roomCode);
      expect(data.players.length).toBe(2);
      expect(data.players[1].name).toBe('Player2');
      clientSocket1.disconnect();
      clientSocket2.disconnect();
      done();
    });
  });
});
