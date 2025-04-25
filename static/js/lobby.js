// Connect to the backend with Socket.IO
const socket = io();

// This class represents a user/player in the game
class User {
  constructor(id, username) {
    this.id = id;
    this.username = username;
  }
}

// This component shows the list of players who have joined the game
class Lobby extends React.Component {
  render() {
    return (
      <ul className="list-group mb-3">
        {this.props.usernames.map((user) => {
          return (
            <li key={user.id} className="list-group-item">
              {user.username}
            </li>
          );
        })}
      </ul>
    );
  }
}

// This is the main component for the lobby screen
class LobbyApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      game_id: props.game_id,     // Game ID passed from HTML
      usernames: [],              // List of players in the game
      text: "",                   // What the user is typing
      nextId: 1                   // We'll assign IDs ourselves
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

    const newUser = new User(this.state.nextId, name);

    // Add player to the list in state
    this.setState({
      usernames: [...this.state.usernames, newUser],
      text: "",
      nextId: this.state.nextId + 1
    });

    // Tell the server someone joined this game
    socket.emit("join", {
      game_id: this.state.game_id,
      username: name
    });
  }

  // Runs when the component is ready on the screen
  componentDidMount() {
    // Whenever someone joins or updates the lobby,
    // the server sends back the full list of players
    socket.on("update_players", (players) => {
      const updatedList = players.map((name, index) => {
        return new User(index + 1, name);
      });
      this.setState({
        usernames: updatedList
      });
    });

    // When the host clicks "Start Game", we get this event
    socket.on("game_started", () => {
      alert("Game is starting soon!");
    });

    // If the server says there was an error
    socket.on("error", (data) => {
      alert(data.message);
    });
  }

  // This draws everything on the screen
  render() {
    return (
      <div className="container mt-5">
        <h1 className="text-center mb-4">Game Lobby</h1>

        <div className="card shadow p-4">
          <h4 className="mb-3">Game ID: {this.state.game_id}</h4>

          <form onSubmit={this.onSubmit}>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Enter your name"
              value={this.state.text}
              onChange={this.onChange}
              required
            />
            <button className="btn btn-primary w-100">Join Game</button>
          </form>

          <h5 className="mt-4">Players Joined:</h5>
          <Lobby usernames={this.state.usernames} />

          <button
            className="btn btn-success w-100"
            onClick={() => {
              socket.emit("start_game", { game_id: this.state.game_id });
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }
}

// This connects the React component to the actual HTML page
const lobbyDiv = document.getElementById("player-list");
const gameID = lobbyDiv.dataset.gameId;
const root = ReactDOM.createRoot(lobbyDiv);
root.render(<LobbyApp game_id={gameID} />);
