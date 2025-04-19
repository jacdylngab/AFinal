# Set up the DB using the following commands:
# $ python
# > from app import db
# > db.create_all()
# > from models import User
# > admin = User(username='admin', email='admin@example.com')
# > db.session.add(admin)
# > db.session.commit()
# > User.query.all()

from app import db                                                        

# Example class
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'))

    def __repr__(self):
        return f'<User {self.username}>'
    
class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.String(16), unique=True, nullable=False)
    users = db.relationship('User', backref='game', lazy=True)

    def __repr__(self):
        return f'<Game {self.game_id}>'
    
class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    value = db.Column(db.Integer, nullable=False, default=0)

    user = db.relationship('User', backref='scores')
    game = db.relationship('Game', backref='scores')

    def __repr__(self):
        return f'<Score {self.value} for User {self.user_id} in Game {self.game_id}>'

class Questions(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    questions = db.Column(db.String(1000), unique=False, nullable=False)
    answer = db.Column(db.String(1000), unique=False, nullable=False)

class GameQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)