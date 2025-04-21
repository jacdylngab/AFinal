class Lobby extends React.Component {
    render() {
        return (
            <ul>
                {this.props.usernames.map( username => {
                    return (
                        <li key={username.id}>{username.name}</li>
                    );
                })}
            </ul>
        );
    }
}

class LobbyApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            game_id: props.game_id,
            usernames: [],
            text: ''
        };
    }

    onChange = (evt) => {
        this.setState({
            text: evt.target.value
        });
    }

    onSubmit = (evt) => {
        evt.preventDefault();
        let newUsername = {
            name: this.state.text,
            id: Date.now(),
        };
        this.setState({
            usernames: this.state.usernames.concat(newUsername),
            text: ''
        });
    }


    render() {
        return (

            <div className="container mt-5">
                <h1 className="text-center mb-4">Game Lobby</h1>

                <div className="card shadow p-4">
                    <h4 className="mb-3">Game ID: {this.state.game_id}</h4>
                
                    <form id="name-form" className="mb-4" onSubmit={this.onSubmit}>
                        <div className="form-group mb-3">
                        <input 
                            type="text" 
                            id="username" 
                            className="form-control" 
                            placeholder="Enter your name" 
                            required 
                            onChange={this.onChange}
                            value={this.state.text}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Add Username</button>
                    </form>

                    <h5>Players Joined:</h5>
                    <Lobby 
                        usernames={this.state.usernames}
                    />
                    <button id="start-btn" className="btn btn-success w-100">Start Game</button>
                </div>
            </div>
        );
    }
}

let lobbyApp = document.getElementById('player-list');
let gameID = lobbyApp.dataset.gameId;
let root = ReactDOM.createRoot(lobbyApp);
root.render(<LobbyApp game_id={gameID}/>);




