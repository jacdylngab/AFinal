from flask import Flask, render_template, request, session, redirect, url_for, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, join_room, emit

import os
import random
import string

app = Flask(__name__)
app.secret_key = 'REPLACE_ME_WITH_RANDOM_CHARACTERS'  

db_name = 'Afinal.db'
sqlite_uri = f'sqlite:///{os.path.abspath(os.path.curdir)}/{db_name}'
app.config['SQLALCHEMY_DATABASE_URI'] = sqlite_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db = SQLAlchemy(app)
socketio = SocketIO(app)

from models import User, Game, Score

# make sure all the tables exist (runs once on startup)
with app.app_context():
    db.create_all()

# this makes a random 16-character game code (letters + numbers)
def generate_game_id(length):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))


@app.route('/')
def main():
    all_games = Game.query.all()  # optional debug print to see game list
    print(f'All_games: {all_games}')
    return render_template('main.html')

# create a new game route
@app.route('/new/')
def new_option():
    game_id = generate_game_id(length=16)

    # make sure the code is unique — if it's already used, make another
    while Game.query.filter_by(game_id=game_id).first():
        game_id = generate_game_id(length=16)

    # save new game to the database
    new_game = Game(game_id=game_id)
    db.session.add(new_game)
    db.session.commit()

    # take user straight to the lobby for this game
    return redirect(url_for('join_game_lobby', game_id=game_id))

#  join game route (takes game_id from URL input form)
@app.route('/join/', methods=["GET"])
def join_option():
    game_id = request.args.get('game_id')

    # check if the game exists
    existing_game_id = Game.query.filter_by(game_id=game_id).first()
    if existing_game_id:
        return redirect(url_for('join_game_lobby', game_id=game_id))
    else:
        # game doesn't exist — show message
        return render_template('main.html', message="The game ID you entered does not exist!")

# 👥 actual game lobby route
@app.route('/join/<game_id>/')
def join_game_lobby(game_id):
    return render_template('lobby.html', game_id=game_id)

# store who joined what game
lobbies = {}

#  when someone joins through SocketIO (real-time)
@socketio.on('join')
def handle_join(data):
    game_id = data['game_id']
    username = data['username']

    join_room(game_id)  # put this player in the room

    # if this is the first player, set up the room
    if game_id not in lobbies:
        lobbies[game_id] = []

    # if this username isn’t already in, add them
    if username not in lobbies[game_id]:
        lobbies[game_id].append(username)

    # update everyone in the room with the full player list
    emit('update_players', lobbies[game_id], room=game_id)

# when someone clicks "Start Game"
@socketio.on('start_game')
def handle_start_game(data):
    game_id = data['game_id']
    emit('game_started', room=game_id)  # send signal to everyone in the room


if __name__ == "__main__":
    socketio.run(app, debug=True)
