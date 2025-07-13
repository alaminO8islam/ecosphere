from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

from .models import db

def create_app():
    load_dotenv()
    app = Flask(__name__)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    CORS(app)

    # Import and register blueprints
    from .routes import auth, dashboard, notes, carbon, notifications
    from .routes.auth import google_bp  # ✅ Google OAuth blueprint

    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(notes.bp)
    app.register_blueprint(carbon.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(google_bp, url_prefix='/login')  # ✅ Register Google OAuth here

    return app
