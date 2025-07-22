from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

from app import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255))
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    avatar = db.Column(db.String(255))
    password = db.Column(db.String(255))
    rank = db.Column(db.String(50))
    progress = db.Column(db.Integer, default=0)
    guest = db.Column(db.Boolean, default=False)
    birthday = db.Column(db.Date)
    name = db.Column(db.String(255))

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"))
    title = db.Column(db.String(255))
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class DashboardData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"))
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    light = db.Column(db.Float)
    ph = db.Column(db.Float)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

class CarbonLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"))
    transport = db.Column(db.Float)
    food = db.Column(db.Float)
    energy = db.Column(db.Float)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"))
    title = db.Column(db.String(255))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def get_user_by_id(user_id):
    return User.query.get(user_id)
