# 🧠 Online Multiplayer Trivia Game

This project is a real-time, multiplayer trivia game built with **React.js** on the frontend and **Python Flask** on the backend, using **WebSockets** and a **database** for persistent game state. Players can join a game using a unique game ID, answer trivia questions together, and watch scores update live.

## 📌 Features

- 🔗 Create or join a game using a 16-character game ID
- 🧑‍🤝‍🧑 Real-time game lobby showing joined players
- 📝 Players choose a display name before the game starts
- 🎮 Multiple-choice trivia questions, one at a time
- 🏆 Live scoreboard with real-time updates
- ✅ Instant feedback after each question
- 🏁 Game over screen showing final scores
- 💾 Database support for storing game and player data

## 🔧 Technologies Used

- **Frontend**: React.js
- **Backend**: Python Flask with Flask-SocketIO
- **Database**: SQLAlchemy
- **WebSockets**: Real-time communication with Flask-SocketIO

## 🧪 How to Run Locally

1. Clone the repo and navigate to the project:
   ```
   git clone https://github.com/jacdylngab/AFinal.git
   cd AFinal

2. Create and activate a virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate    # On Windows use: venv\Scripts\activate

3. Install dependencies:
   ```
   pip install -r requirements.txt

4. Run the Flask server:
   ```
   flask run

