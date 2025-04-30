// Connect to the backend with Socket.IO
const socket = io();

// This class represents a user/player in the game
class User {
  constructor(id, username, score) {
    this.id = id;
    this.username = username;
    this.score = score;
  }
}

// LOBBY SCREEN
class Lobby extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",       // what the user is typing
      nextId: 1       // ID counter
    };
  }

  onChange = (event) => {
    this.setState({ text: event.target.value });
  };

  onSubmit = (event) => {
    event.preventDefault();
    const name = this.state.text.trim();
    if (!name) return;

    socket.emit("join", {
      game_id: this.props.game_id,
      username: name
    });

    this.props.onJoin(name);

    this.setState({
      text: "",
      nextId: this.state.nextId + 1
    });
  };

  render() {
    return (
      <div className="container mt-5">
        <h1 className="text-center mb-4">Game Lobby</h1>

        <div className="card shadow p-4">
          <h4 className="mb-3">Game ID: {this.props.game_id}</h4>

          <form onSubmit={this.onSubmit}>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Enter your name"
              value={this.state.text}
              onChange={this.onChange}
              required
            />
            <button type="submit" className="btn btn-primary w-100">Join Game</button>
          </form>

          <h5 className="mt-4">Players Joined:</h5>
          <ul className="list-group mb-3">
            {this.props.usernames.map((user) => (
              <li key={user.id} className="list-group-item">{user.username}</li>
            ))}
          </ul>

          <button
            className="btn btn-success w-100"
            onClick={() => socket.emit("start_game", { game_id: this.props.game_id })}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }
}

// GAME SCREEN
class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      question: "",
      options: [],
      answer: "",
      selectedOption: null,
      error: null
    };
  }

  OptionClicked = (selectedOption) => {
    console.log("You clicked:", selectedOption);

    socket.emit("question", {
      game_id: this.props.game_id,
      username: this.props.myUsername
    });

    if (selectedOption === this.state.answer) {
      this.setState({ selectedOption });
      socket.emit("score_update", {
        game_id: this.props.game_id,
        username: this.props.myUsername
      });
    } else {
      this.setState({ selectedOption });
    }
  };

  componentDidMount() {
    socket.on("question", (data) => {
      this.setState({
        question: data.question,
        options: data.options,
        answer: data.answer,
        selectedOption: null
      });
    });

    // This ends the game and sends players to the game over screen
    socket.on("game_over", () => {
      this.props.endGame(); // call parent function to switch view
    });

    this.setState({
      question: this.props.question,
      options: this.props.options,
      answer: this.props.answer
    });
  }

  render() {
    return (
      <div className="d-flex flex-column align-items-center mt-5">
        <div className="card p-4 shadow mb-4" style={{ maxWidth: "600px", width: "100%" }}>
          <h2 className="mb-3">{this.state.question}</h2>
          <div className="d-flex flex-column gap-2">
            {this.state.options.map((option) => {
              let buttonClass = "btn btn-outline-primary";

              if (this.state.selectedOption !== null) {
                if (option === this.state.answer) buttonClass = "btn btn-success";
                else if (option === this.state.selectedOption) buttonClass = "btn btn-danger";
                else buttonClass = "btn btn-secondary";
              }

              return (
                <button
                  key={option}
                  className={buttonClass}
                  onClick={() => this.OptionClicked(option)}
                  disabled={this.state.selectedOption !== null}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card shadow p-4 mt-4" style={{ maxWidth: "600px", width: "100%" }}>
          <h3 className="text-center mb-4">Scoreboard</h3>
          <table className="table table-striped text-center">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {this.props.usernames.map((user) => (
                <tr key={user.id}>
                  <th scope="row">{user.id}</th>
                  <td>{user.username}</td>
                  <td>{user.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

// GAME OVER SCREEN
function GameOver({ usernames }) {
  const sorted = [...usernames].sort((a, b) => b.score - a.score);

  return (
    <div className="d-flex flex-column align-items-center mt-5">
      <h1 className="mb-3">🎉 Game Over 🎉</h1>
      <h4 className="mb-4">Final Scores:</h4>

      <table className="table table-bordered text-center" style={{ maxWidth: "500px", width: "100%" }}>
        <thead className="table-light">
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.username}</td>
              <td>{user.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <a href="/" className="btn btn-primary mt-4">Return to Home</a>
    </div>
  );
}

// MAIN APP COMPONENT
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 'lobby',
      game_id: props.game_id,
      usernames: [],
      myUsername: "",
      question: "",
      options: [],
      answer: ""
    };
  }

  onJoin = (username) => {
    this.setState({ myUsername: username });
  };

  updateScores = (updatedUsernames) => {
    this.setState({ usernames: updatedUsernames });
  };

  componentDidMount() {
    socket.emit("join", {
      game_id: this.state.game_id,
      username: ""
    });

    socket.on("update_players", (players) => {
      const updatedList = Object.entries(players).map(([username, score], index) => {
        return new User(index + 1, username, score);
      });
      this.setState({ usernames: updatedList });
    });

    socket.on("game_started", (data) => {
      this.setState({
        view: "game",
        question: data.question,
        options: data.options,
        answer: data.answer
      });
    });

    socket.on("error", (data) => {
      alert(data.message);
    });

    socket.on("game_over", () => {
      this.setState({ view: "game_over" });
    });
  }

  render() {
    let screen;
    if (this.state.view === "lobby") {
      screen = (
        <Lobby
          usernames={this.state.usernames}
          game_id={this.state.game_id}
          myUsername={this.state.myUsername}
          onJoin={this.onJoin}
        />
      );
    } else if (this.state.view === "game") {
      screen = (
        <Game
          usernames={this.state.usernames}
          game_id={this.state.game_id}
          myUsername={this.state.myUsername}
          updateScores={this.updateScores}
          question={this.state.question}
          options={this.state.options}
          answer={this.state.answer}
          endGame={() => this.setState({ view: "game_over" })}
        />
      );
    } else if (this.state.view === "game_over") {
      screen = <GameOver usernames={this.state.usernames} />;
    }

    return <div className="container mt-5">{screen}</div>;
  }
}

// Connect the App component to the HTML div
const gameDiv = document.getElementById("player-list");
const gameID = gameDiv.dataset.gameId;
const root = ReactDOM.createRoot(gameDiv);
root.render(<App game_id={gameID} />);
