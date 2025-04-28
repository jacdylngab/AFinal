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

// This is the main component for the lobby screen
class Lobby extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",                   // What the user is typing
      nextId: 1,                   // We'll assign IDs ourselves
    };
  }

  // This runs when someone types in the input box
  onChange = (event) => {
    this.setState({
      text: event.target.value
    });
  }

  // When the user clicks "Join Game" button
  onSubmit = (event) => {
    event.preventDefault(); // Don’t refresh the page

    const name = this.state.text.trim(); // Get what they typed
    if (!name) {
      return; // If the name is empty, just stop
    }

    // Tell the server someone joined this game
    socket.emit("join", {
      game_id: this.props.game_id,
      username: name
    });

    this.props.onJoin(name);

    // Add player to the list in state
    this.setState({
      text: "",
      nextId: this.state.nextId + 1
    });

  }

  // This draws everything on the screen
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
            <button className="btn btn-primary w-100"
            type="submit"
            >
              Join Game
              </button>
          </form>

          <h5 className="mt-4">Players Joined:</h5>
          <ul className="list-group mb-3">
            {this.props.usernames.map((user) => {
              return (
                <li key={user.id} className="list-group-item">
                  {user.username}
                </li>
              );
            })}
          </ul>

          <button
            className="btn btn-success w-100"
            onClick={() => {
              socket.emit("start_game", { game_id: this.props.game_id });
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      question: "",
      options: [],
      answer: "",
      error: null,
      selectedOption: null
    };
  }

  OptionClicked = (selectedOption) => {
    console.log("You clicked:", selectedOption);

    if (selectedOption === this.state.answer) {
      console.log("Right answer");
      this.setState({
        selectedOption: selectedOption,
      });

      // Tell the server that you got the correct answer
      socket.emit("score_update", {
        game_id: this.props.game_id,
        username: this.props.myUsername
      });

    } 
    
    else {
      console.log("Wrong answer");
      this.setState({
        selectedOption: selectedOption,
      });

    }
  };

  componentDidMount() {
    fetch('/api/questions')
    .then(result => result.json())
    .then(
      (result) => {
        this.setState({
          question: result['question'],
          options: result['options'],
          answer: result['answer']
        });
      },
      (error) => {
        this.setState({
          error: error,
        });
      }
    )
  }

  render() {
    if (this.state.error) {
      return (
        <div>An error occurred!</div>
      ); 
    }
    else {
      return (
        <div className="d-flex flex-column align-items-center mt-5">
          <div className="card p-4 shadow mb-4" style={{ maxWidth: "600px", width: "100%" }}>
            <h2 className="mb-3" id="question-text">
              {this.state.question}
            </h2>

            <div id="options-list" className="d-flex flex-column gap-2">
              {this.state.options.map(option => {
                let buttonClass = "btn btn-outline-primary option-btn";

                if (this.state.selectedOption !== null) {
                  if (option === this.state.answer) {
                    buttonClass = "btn btn-success"; // Correct answer is green
                  }
                  else if (option === this.state.selectedOption) {
                    buttonClass = "btn btn-danger"; // Wrong answer is red
                  }
                  else {
                    buttonClass = "btn btn-secondary"; // Other buttons are gray
                  }
                }
                return (
                <button
                  key={option}
                  className={buttonClass}
                  onClick={() => this.OptionClicked(option)} 
                  disabled={this.state.selectedOption !== null} // Disable after first click
                  data-value="{option}"
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
                  <th scope="col">Rank</th>
                  <th scope="col">Player</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody id="scoreboard-body">
                  {this.props.usernames.map((user) => {
                    return (
                      <tr key={user.id}>
                        <th scope="row">{user.id}</th>
                        <td>{user.username}</td>
                        <td>{user.score}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
    );

    }
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 'lobby',
      game_id: props.game_id,
      usernames: [],
      myUsername: "",
    };
  }

  onJoin = (username) => {
    this.setState({
      myUsername: username
    });
  }

  updateScores = (updatedUsernames) => {
    this.setState({
      usernames: updatedUsernames
    });
  }

  // Runs when the component is ready on the screen
  componentDidMount() {
    // This for whenever someone refreshes the page stays consistent
    socket.emit("join", { 
      game_id: this.state.game_id, 
      username: "" // Blank username because we're just refreshing.
    });

    // Whenever someone joins or updates the lobby,
    // the server sends back the full list of players
    socket.on("update_players", (players) => {
      const updatedList = Object.entries(players).map(([username, score], index) => {
        return new User(index + 1, username, score);
      });
      this.setState({
        usernames: updatedList
      });
    });

    // When the host clicks "Start Game", we get this event
    socket.on("game_started", () => {
      this.setState({ view: 'game' });
    });

    // If the server says there was an error
    socket.on("error", (data) => {
      alert(data.message);
    });

  }

  render() {
    let screen; // screen

    if (this.state.view === "lobby") {
      screen = (
        <Lobby 
          usernames={this.state.usernames}
          game_id={this.state.game_id}
          myUsername={this.state.myUsername}
          onJoin={this.onJoin}
        />
      );
    }

    else if (this.state.view === "game") {
      screen = (
      <Game 
          usernames={this.state.usernames}
          game_id={this.state.game_id}
          myUsername={this.state.myUsername}
          updateScores={this.updateScores}
      />
      );
    }

    return (
      <div className="container mt-5">
        {screen}
      </div>
    );
  }
  }

// This connects the React component to the actual HTML page
const gameDiv = document.getElementById("player-list");
const gameID = gameDiv.dataset.gameId;
const root = ReactDOM.createRoot(gameDiv);
root.render(<App game_id={gameID} />);
