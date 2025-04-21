from flask import Flask, render_template, request, session, redirect, url_for, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
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

from models import User, Game, Score, Questions, GameQuestion

with app.app_context():
    db.create_all()

def generate_game_id(length):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

@app.route('/')
def main():
    return render_template('main.html')

@app.route('/new/', methods=['GET'])
def new_option():
    game_id = generate_game_id(length=16)

    existing_game_id = Game.query.filter_by(game_id=game_id).first()

    while existing_game_id: # If the game id already exist create a new one
        game_id = generate_game_id(length=16)
    
    new_game = Game(game_id=game_id)
    db.session.add(new_game)
    db.session.commit()

    return redirect(url_for('join_game_lobby', game_id=game_id))

@app.route('/join/', methods=["GET"])
def join_option():
    game_id = request.args.get('game_id')
    existing_game_id = Game.query.filter_by(game_id=game_id).first()

    all_games = Game.query.all()
    print(f'All_games: {all_games}')

    if existing_game_id:
        return redirect(url_for('join_game_lobby', game_id=game_id))
    else:
        return render_template('main.html', message="The game id you entered does not exist!")

@app.route('/join/<game_id>/', methods=['GET'])
def join_game_lobby(game_id):
    return f"Joined game {game_id}"