
// This is the game lobby.
// has a game code and a list of players
class Game {
    constructor(id, game_id) {
        this.id = id;
        this.game_id = game_id;
        this.players = []; // this will store User objects
    }

    // adds player if not already added
    addPlayer(user) {
        if (!this.players.find(p => p.id === user.id)) {
            this.players.push(user);
        }
    }

    
    // gives summary like: "Game ABC123 with 2 player(s)"
    toString() {
        return `Game ${this.game_id} with ${this.players.length} player(s)`;
    }
}
