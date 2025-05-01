from flask import Flask, render_template, request, session, redirect, url_for, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, join_room, emit
from sqlalchemy.sql.expression import func

import os
import random
import string
import time 

app = Flask(__name__)
app.secret_key = 'REPLACE_ME_WITH_RANDOM_CHARACTERS'  

db_name = 'Afinal.db'
sqlite_uri = f'sqlite:///{os.path.abspath(os.path.curdir)}/{db_name}'
app.config['SQLALCHEMY_DATABASE_URI'] = sqlite_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db = SQLAlchemy(app)
socketio = SocketIO(app)

from models import Game, Question 

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

# actual game lobby route
@app.route('/join/<game_id>/')
def join_game_lobby(game_id):
    return render_template('game.html', game_id=game_id)

# store who joined what game
lobbies = {}

@socketio.on('question')
def handle_question(data):
    game_id = data['game_id']
    username = data['username']
    sid = request.sid
    
    lobby = lobbies[game_id]

    if "clicked" not in lobby:
        lobby["clicked"] = []

    lobby["clicked"].append(username)


    if lobby["questions_remaining"]:
        question = random.choice(lobby["questions_remaining"])
        if len(lobby["clicked"]) == len(lobby["players"]):
            lobby["clicked"].clear() # Reset the clicked list for the next question
            lobby["questions_remaining"].remove(question) # Remove the question so it does come again
            time.sleep(1)
            emit('question', question, room=game_id)  # send signal to everyone in the room
    
    else:
        if len(lobby["clicked"]) == len(lobby["players"]):
            time.sleep(1)
            emit('game_over', room=game_id)
            # Game is over delete the game id
            game_id_delete = Game.query.filter_by(game_id=game_id).first()
            print(f"Game id to delete: {game_id_delete}")

            if game_id_delete:
                db.session.delete(game_id_delete)
                db.session.commit()
            else:
                print("Game not found")
                return

            del lobbies[game_id]
            print(f"Lobbies: {lobbies}")


#  when someone joins through SocketIO (real-time)
@socketio.on('join')
def handle_join(data):
    game_id = data['game_id']
    username = data['username']
    sid = request.sid # Browser session id

    join_room(game_id)  # put this player in the room

    # if this is the first player, set up the room
    if game_id not in lobbies:
        lobbies[game_id] = {
            "players": {}, # Key: username, Value: Score
            "sockets": {}, # Key: sid, Value: username
        }

    lobby = lobbies[game_id]

    # Check if the socket already joined 
    if sid in lobby["sockets"]:
        emit('error', {"message": "You have already joined from this tab."}, room=sid)
        return

    # If the username has already been taken
    if username in lobby["players"]:
        emit('error', {"message": "The username has already been chosen."}, room=sid)
        return

    # if this username isn’t already in, add them
    if username and username not in lobby:
        lobby["players"][username] = 0
        lobby["sockets"][sid]= username
        lobby["questions_remaining"] = []
    

    # update everyone in the room with the full player list
    emit('update_players', lobby["players"], room=game_id)

# when someone clicks "Start Game"
@socketio.on('start_game')
def handle_start_game(data):
    game_id = data['game_id']
    sid = request.sid

    lobby = lobbies[game_id]

    all_questions = Question.query.all() 

    questions_list = []

    for question in all_questions:
        questions_list.append({
            "question": question.question_text,
            "options": [question.option_a, question.option_b, question.option_c, question.option_d],
            "answer": question.correct_answer,
        })

    if len(lobby["players"]) < 2: 
         emit('error', {"message": "You need atleast two players to start the game."}, room=sid)
    
    else: 
        lobby["questions_remaining"] = random.sample(questions_list, 5) # Get 5 random questions
        first_question = lobby["questions_remaining"].pop(0)
        emit('game_started', first_question, room=game_id)  # send signal to everyone in the room

# If the user disconnects/closes their tab or browser
@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid 

    for game_id, lobby in lobbies.items():
        if sid in lobby["sockets"]:
            username = lobby["sockets"].pop(sid)
            if username in lobby["players"]:
                lobby["players"].pop(username)
            emit('update_players', lobby["players"], room=game_id)
            break

# If somebody scored
@socketio.on('score_update')
def handle_score_update(data):
    game_id = data['game_id']
    username = data['username']

    lobby = lobbies[game_id]

    if game_id in lobbies and username in lobby["players"]:
        lobby["players"][username] += 1

    sorted_by_scores = dict(sorted(lobby["players"].items(), key=lambda item: item[1], reverse=True))
    # update everyone in the room with the full player list
    emit('update_players', sorted_by_scores, room=game_id)

if __name__ == "__main__":
    socketio.run(app, debug=True)

