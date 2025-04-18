from flask import Flask, render_template, request, session, redirect, url_for, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
import os 

app = Flask(__name__)
app.secret_key = 'REPLACE_ME_WITH_RANDOM_CHARACTERS'

db_name = 'Afinal.db'
sqlite_uri = f'sqlite:///{os.path.abspath(os.path.curdir)}/{db_name}'
app.config['SQLALCHEMY_DATABASE_URI'] = sqlite_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

from models import User

with app.app_context():
    db.create_all()

@app.route('/')
def main():
    return render_template('main.html')

@app.route('/new/', methods=['GET'])
def new_option():
    pass

@app.route('/join/<game_id>', methods=['GET'])
def join_option(game_id):
    pass