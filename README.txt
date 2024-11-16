Cards Against Humanity - Browser Game
Overview
This is a multiplayer, browser-based game inspired by Cards Against Humanity, built with Node.js and Socket.io. The game allows players to join a room, play rounds by choosing and scoring answers, and enjoy a lighthearted experience with friends.

Features
Room creation and unique room codes
Real-time multiplayer functionality
Answer selection phase with auto-progression on timer or all submissions
Scoring system to track the funniest player
AFK handling to prevent delays
Setup Instructions
Prerequisites
Node.js (v12 or higher recommended)
npm (comes with Node.js)
1. Clone the Repository
Download the repository files and navigate to the project directory.

2. Install Dependencies
Run the following command to install necessary packages:

bash
Copy code
npm install
3. Running the Server
To start the game server, use:

bash
Copy code
node src/server.js
The server will run on http://localhost:3000 by default. You can access the game by opening this URL in a browser.

4. Running Tests
Jest is used for unit testing. To run the tests, use:

bash
Copy code
npm test
This will execute all test suites and provide feedback on the game’s functionality, including game state management, room logic, answer selection, scoring, and timer progression.

Game Instructions
Creating a Room: A player creates a room by entering a unique room code.
Joining a Room: Other players join by entering the room code provided.
Answer Selection: During each round, players choose answers within a set time limit (1 minute), or until all players submit answers.
Scoring: The round master scores the answers, and the game progresses to the next round.
Additional Notes
AFK Handling: Players who do not choose an answer within the time limit will be automatically skipped.
Customization: Placeholder questions/answers are stored in src/data/questions.json for easy updates or customizations.



This project is free and open-source. Donations are entirely optional and help support future development. 
If you'd like to contribute, you can send UDSC to: [will be added if I bancrupt]

Donations are not required to use this project.
By donating, you acknowledge that this is a voluntary contribution and not a payment for services or goods.

