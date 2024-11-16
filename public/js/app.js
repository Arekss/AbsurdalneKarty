function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
} // TO DELETE LATER


const socket = io();

let selectedAnswer = null; // Track the selected answer
let selectedWinnerId = null; // Track the selected winner

// Room creation and joining
document.getElementById('createRoom').addEventListener('click', () => {
 // const playerName = prompt("Enter your name:");
 // if (!playerName) return;
 const playerName = generateRandomString(6);
  socket.emit('createRoom', { playerName });


});

document.getElementById('joinRoom').addEventListener('click', () => {
 // const playerName = prompt("Enter your name:");
  //if (!playerName) return;
  const playerName = generateRandomString(6);
  const roomCode = document.getElementById('joinCode').value;
  socket.emit('joinRoom', { roomCode, playerName });

  // Hide menu and show game view for the player who joins
  document.getElementById('menu').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  document.getElementById('playerListContainer').style.display = 'block';
});

socket.on('roomCreated', (data) => {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  document.getElementById('roomCodeDisplay').textContent = `Room Code: ${data.roomCode}`;
  document.getElementById('startGame').style.display = 'block';  // Show start game button for room creator
  document.getElementById('playerListContainer').style.display = 'block';
});

// Start game button event listener
document.getElementById('startGame').addEventListener('click', () => {
  socket.emit('startGame');
  document.getElementById('startGame').style.display = 'none';  // Hide start game button after starting
});

// Update room view when players join or when the game starts
socket.on('updateRoomDisplay', (data) => {
  const playerTableBody = document.getElementById('playerTable').querySelector('tbody');
  playerTableBody.innerHTML = ''; // Clear existing rows

  // Update player rows dynamically
  data.players.forEach(player => {
    // Create a row for each player
    const row = document.createElement('tr');
    row.setAttribute('data-player-id', player.id); // Store player ID invisibly

    // Create the name cell
    const nameCell = document.createElement('td');
    nameCell.textContent = player.name;

    // Create the status cell for the round master indicator
    const roundMasterCell = document.createElement('td');
    if (player.id === data.roundMaster) {
      roundMasterCell.textContent = 'round master';
      roundMasterCell.classList.add('round-master-indicator'); // Apply purple styling
    }

    // Append the cells to the row
    row.appendChild(nameCell);
    row.appendChild(roundMasterCell);

    // Append the row to the table body
    playerTableBody.appendChild(row);
  });

  // Update other dynamic elements
  document.getElementById('menu').style.display = 'none';
  document.getElementById('game').style.display = 'block';

  document.getElementById('roomCodeDisplay').textContent = `Room Code: ${data.roomCode}`;
  document.getElementById('question').textContent = data.question || 'Oczekiwanie na start gry...';
});



document.getElementById('submitAnswer').addEventListener('click', () => {
  if (selectedAnswer) {
    socket.emit('submitAnswer', { answer: selectedAnswer });
    document.getElementById('submitAnswer').style.display = 'none';  // Hide after submitting
    selectedAnswer = null;  // Reset the selected answer
  } else {
    alert("Please select an answer before submitting!");
  }
});

socket.on('updateAndDisplayCards', (data) => {
  // Reset selected answer and update question
  selectedAnswer = null;
  document.getElementById('question').textContent = data.question;
  
  // Reset player row colors to default
  const playerTableBody = document.getElementById('playerTable').querySelector('tbody');
  const rows = playerTableBody.querySelectorAll('tr');
  rows.forEach(row => {
    row.style.backgroundColor = ''; // Reset to default
  });

  // Clear the answer buttons
  const handContainer = document.getElementById('answers');
  handContainer.innerHTML = ''; 

  // Exit if the current user is the round master
  if (data.roundMaster === socket.id) return;

  // Show the submit button for players (not for the round master)
  document.getElementById('submitAnswer').style.display = 'block';

  // Display each card as a button for answer selection
  const playerHand = data.hand || [];
  playerHand.forEach(card => {
    const button = document.createElement('button');
    button.textContent = card;

    // Click event for selecting the answer
    button.addEventListener('click', () => {
      selectedAnswer = card;
      [...handContainer.children].forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');  // Highlight the selected button
    });

    handContainer.appendChild(button);
  });
});


// Add the event listener for the "chooseWinner" button on page load
document.getElementById('chooseWinner').addEventListener('click', () => {
  if (selectedWinnerId) {
    socket.emit('chooseWinner', { winnerId: selectedWinnerId }, (response) => {
      if (response.success) {
        // Emit the next event only after acknowledgment
        socket.emit('startNewRound');
      } else {
        alert(`Error: ${response.message}`);
      }
    });

    // Hide the button after submission
    selectedWinnerId = null;
    document.getElementById('chooseWinner').style.display = 'none';
  } else {
    alert('Please select an answer before submitting the winner.');
  }
});


function revealAnswersForMaster(data) {
  selectedWinnerId = null; // Reset the selected winner

  const answersContainer = document.getElementById('answers');
  answersContainer.innerHTML = ''; // Clear any existing answers
  data.answers.forEach(answerObj => {
    if (answerObj.answer) { // Ensure the answer exists
      const button = document.createElement('button');
      button.textContent = answerObj.answer; // Display the answer text

      // Click event for marking the selected winner
      button.addEventListener('click', () => {
        selectedWinnerId = answerObj.playerId; // Track selected player's ID
        [...answersContainer.children].forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected'); // Highlight the selected button
      });

      answersContainer.appendChild(button);
    }
  });

  // Show the "chooseWinner" button
  document.getElementById('chooseWinner').style.display = 'block';
}

function revealAnswersForPlayers(data) {
  // Display answers for non-round master players
  const answersContainer = document.getElementById('answers');
  answersContainer.innerHTML = ''; // Clear any existing answers
  answersContainer.innerHTML = data.answers
    .map(answerObj => answerObj.answer ? `<div>${answerObj.answer}</div>` : '')
    .join('');
} 

// Reveal answers to all players, round master selects the funniest answer
socket.on('revealAnswers', (data) => {
  document.getElementById('question').textContent = data.question;

  // Only the round master sees the answer buttons for selection
  if (data.roundMaster === socket.id) {
    revealAnswersForMaster(data);
  } else {
    revealAnswersForPlayers(data);
  }
});

// Start new round view and update scores
socket.on('newRound', (data) => {
  document.getElementById('scores').textContent = "scoresTBD"; //JSON.stringify(data.scores);
  document.getElementById('question').textContent = "New round starting...";
  document.getElementById('timer').textContent = "";
  document.getElementById('submitAnswer').style.display = 'none';
  document.getElementById('chooseWinner').style.display = 'none';
});

socket.on('onSumbitAnswerMarkPlayerGreen', (data) => {
  const playerTableBody = document.getElementById('playerTable').querySelector('tbody');
  const rows = playerTableBody.querySelectorAll('tr');

  rows.forEach(row => {
    if (row.getAttribute('data-player-id') === data.playerId) {
      row.style.backgroundColor = 'lightgreen'; // Highlight the row in green
    }
  });
});

socket.on('error', (data) => {
  alert(data.message);

  switch (data.message) {
    case 'Room not found or full':
      // Specific action for room-related errors
      document.getElementById('menu').style.display = 'block';
      document.getElementById('game').style.display = 'none';
      document.getElementById('joinCode').value = ''; // Clear the room code field if needed
      break;

    case 'Another error type':
      // Specific action for another error
      // For example, you can display a custom message or restore specific UI elements
      break;

    default:
      // General case: if error is not specifically handled, reset to menu view
      document.getElementById('menu').style.display = 'block';
      document.getElementById('game').style.display = 'none';
      break;
  }
});