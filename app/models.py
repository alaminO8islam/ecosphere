from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, date, time
from sqlalchemy.ext.hybrid import hybrid_property
from werkzeug.security import generate_password_hash, check_password_hash
import os

from app import db

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    avatar = db.Column(db.String(255), default='default-avatar.png')
    _password = db.Column('password', db.String(255), nullable=False)
    user_rank = db.Column(db.Integer, default=1)
    progress = db.Column(db.Integer, default=0)
    guest = db.Column(db.Boolean, default=False)
    birthday = db.Column(db.Date)
    name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')
    dashboard_data = db.relationship('DashboardData', backref='user', lazy=True, cascade='all, delete-orphan')
    carbon_logs = db.relationship('CarbonLog', backref='user', lazy=True, cascade='all, delete-orphan')
    vitamin_records = db.relationship('VitaminDRecord', backref='user', lazy=True, cascade='all, delete-orphan')
    notes = db.relationship('Note', backref='user', lazy=True, cascade='all, delete-orphan')
    articles = db.relationship('Article', backref='user', lazy=True, cascade='all, delete-orphan')
    activities = db.relationship('UserActivity', backref='user', lazy=True, cascade='all, delete-orphan')
    progress_data = db.relationship('UserProgress', backref='user', lazy=True, cascade='all, delete-orphan')
    weather_analytics = db.relationship('WeatherAnalytics', backref='user', lazy=True, cascade='all, delete-orphan')
    air_quality_analytics = db.relationship('AirQualityAnalytics', backref='user', lazy=True, cascade='all, delete-orphan')
    
    @hybrid_property
    def password(self):
        return self._password
    
    @password.setter
    def password(self, plaintext_password):
        self._password = generate_password_hash(plaintext_password)
    
    def check_password(self, plaintext_password):
        return check_password_hash(self._password, plaintext_password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'user_rank': self.user_rank,
            'progress': self.progress,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notification'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))  # ← Changed to 'users.id'
    title = db.Column(db.String(255))
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class DashboardData(db.Model):
    __tablename__ = 'dashboard_data'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))  # ← Changed to 'users.id'
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    light = db.Column(db.Float)
    ph = db.Column(db.Float)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

class CarbonLog(db.Model):
    __tablename__ = 'carbon_log'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))  # ← Changed to 'users.id'
    transport = db.Column(db.Float)
    food = db.Column(db.Float)
    energy = db.Column(db.Float)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)

class VitaminLog(db.Model):
    __tablename__ = 'vitamin_log'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))
    city = db.Column(db.String(50))
    country = db.Column(db.String(50))
    temp = db.Column(db.Float)
    humidity = db.Column(db.Float)
    uvi = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WeatherAnalytics(db.Model):
    __tablename__ = 'weather_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    date = db.Column(db.Date, default=date.today)
    time = db.Column(db.Time, default=datetime.now().time)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.isoformat() if self.time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AirQualityAnalytics(db.Model):
    __tablename__ = 'air_quality_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))
    pm2_5 = db.Column(db.Float)
    pm10 = db.Column(db.Float)
    date = db.Column(db.Date, default=date.today)
    time = db.Column(db.Time, default=datetime.now().time)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pm2_5': self.pm2_5,
            'pm10': self.pm10,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.isoformat() if self.time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    # Relationship removed - already defined in User model

class VitaminDRecord(db.Model):
    __tablename__ = 'vitamin_d_record'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # ← Changed to 'users.id'
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    uv_index = db.Column(db.Float)
    status = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=db.func.now())

class VitaminDHistory(db.Model):
    __tablename__ = 'vitamin_d_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))
    gender = db.Column(db.String(10))  # 'male' or 'female'
    serum_level = db.Column(db.Float)  # in ng/mL
    skin_type = db.Column(db.String(50))
    age_group = db.Column(db.String(50))
    exposure_time = db.Column(db.Integer)  # in minutes
    vitamin_d_amount = db.Column(db.Float)  # in IU
    timestamp = db.Column(db.DateTime, default=db.func.now())
    
    # Relationship
    user = db.relationship('User', backref=db.backref('vitamin_d_history', lazy=True, cascade='all, delete-orphan'))

class Note(db.Model):
    __tablename__ = 'note'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))  # ← Changed to 'users.id'
    title = db.Column(db.String(255))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Article(db.Model):
    __tablename__ = 'article'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))
    title = db.Column(db.String(255))
    content = db.Column(db.Text)
    image_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    comments = db.relationship('ArticleComment', backref='article', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_id': self.user_id,
            'author': self.user.name if self.user else None
        }

class UserActivity(db.Model):
    __tablename__ = 'user_activity'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # ← Changed to 'users.id'
    action_type = db.Column(db.String(50))  # "carbon_check", "vitamin_check", "post"
    count = db.Column(db.Integer, default=1)
    timestamp = db.Column(db.DateTime, default=db.func.now())

class UserProgress(db.Model):
    __tablename__ = 'user_progress'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # ← Changed to 'users.id'
    current_rank = db.Column(db.Integer, default=1)
    progress = db.Column(db.Integer, default=0)  # 0–100 scale
    badge = db.Column(db.String(100))  # current unlocked badge
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

class RankObjective(db.Model):
    __tablename__ = 'rank_objective'  # ← Added for consistency
    
    id = db.Column(db.Integer, primary_key=True)
    rank = db.Column(db.Integer)
    objective = db.Column(db.String(100))
    required_count = db.Column(db.Integer)

class UserObjectiveProgress(db.Model):
    __tablename__ = 'user_objective_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    objective_id = db.Column(db.Integer, db.ForeignKey("rank_objective.id"))
    count = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('objective_progress', lazy=True, cascade='all, delete-orphan'))
    objective = db.relationship('RankObjective', backref=db.backref('user_progress', lazy=True))

class ArticleComment(db.Model):
    __tablename__ = 'article_comment'
    
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id', ondelete="CASCADE"))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('article_comments', lazy=True))
    replies = db.relationship('ArticleCommentReply', backref='comment', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'article_id': self.article_id,
            'user_id': self.user_id,
            'author': self.user.name if self.user else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'replies': [reply.to_dict() for reply in self.replies]
        }

class ArticleCommentReply(db.Model):
    __tablename__ = 'article_comment_reply'
    
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('article_comment.id', ondelete="CASCADE"))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('article_comment_replies', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'comment_id': self.comment_id,
            'user_id': self.user_id,
            'author': self.user.name if self.user else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

def get_user_by_id(user_id):
    return User.query.get(user_id)

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def create_user(email, password, first_name, last_name):
    user = User(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        name=f"{first_name} {last_name}"
    )
    db.session.add(user)
    db.session.commit()
    return user

def log_user_activity(user_id, action_type):
    """Log user activity and update progress"""
    activity = UserActivity(
        user_id=user_id,
        action_type=action_type
    )
    db.session.add(activity)
    
    # Check for existing activity today
    today = datetime.utcnow().date()
    existing = UserActivity.query.filter(
        UserActivity.user_id == user_id,
        UserActivity.action_type == action_type,
        db.func.date(UserActivity.timestamp) == today
    ).first()
    
    # If this is first activity of this type today, update progress
    if not existing or existing.id == activity.id:
        user = User.query.get(user_id)
        if user:
            user.progress += 5  # Add 5 points for each new activity type per day
            
            # Check if user should level up
            if user.progress >= 100:
                user.user_rank += 1
                user.progress = 0
                
                # Create notification for level up
                notification = Notification(
                    user_id=user_id,
                    title="Level Up!",
                    message=f"Congratulations! You've reached rank {user.user_rank}!"
                )
                db.session.add(notification)
    
    db.session.commit()
    return activity
