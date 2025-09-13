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
    
    # Use MySQL database configuration
    database_url = os.getenv('DATABASE_URL', 'mysql+pymysql://root:root123@127.0.0.1:3306/ecosphere')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.logger.info(f'Using XAMPP MySQL database: {database_url}')
    
    # Add database connection pool settings for XAMPP
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_recycle': 280,
        'pool_timeout': 20,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 30,
            'read_timeout': 30,
            'write_timeout': 30,
            'charset': 'utf8mb4'
        }
    }
    
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
    from .routes import auth, dashboard, main, carbon, vitamin, notes, notifications, users, progress, articles, comments
    app.register_blueprint(auth.site_bp)
    app.register_blueprint(auth.api_bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(main.bp)
    app.register_blueprint(carbon.bp)
    app.register_blueprint(vitamin.bp)
    app.register_blueprint(notes.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(progress.bp)
    app.register_blueprint(articles.bp)
    app.register_blueprint(comments.bp)

    from .routes.env import bp as env_bp
    app.register_blueprint(env_bp, url_prefix="/api/env")

    return app
