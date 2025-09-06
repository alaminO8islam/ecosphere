from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv
import os

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret')

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    from .models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Import and register blueprints AFTER db + login are set up
    from .routes import auth, dashboard, main, carbon, vitamin, notes, notifications
    app.register_blueprint(auth.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(main.bp)
    app.register_blueprint(carbon.bp)
    app.register_blueprint(vitamin.bp)
    app.register_blueprint(notes.bp)
    app.register_blueprint(notifications.bp)

    from .routes.env import bp as env_bp
    app.register_blueprint(env_bp, url_prefix="/api/env")

    return app