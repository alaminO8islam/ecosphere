import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, init, migrate, upgrade
from dotenv import load_dotenv
import pymysql

# Add the project directory to the Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Import the app and models
from app import create_app, db
from app.models import User, UserActivity

def init_db():
    """Initialize the database with required tables"""
    app = create_app()
    
    with app.app_context():
        # Check database connection
        try:
            # Try to connect to the database
            db.engine.connect()
            print("✅ Database connection successful!")
            
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Check if admin user exists
            admin = User.query.filter_by(email='admin@ecosphere.com').first()
            if not admin:
                # Create admin user
                admin = User(
                    email='admin@ecosphere.com',
                    password='pbkdf2:sha256:150000$GJVyLd5N$5eb63bae1e5abd267a7f44cadf8e53d0fd9f6d6f9e402a43df29fb7f13f56c0a',  # 'admin123'
                    first_name='Admin',
                    last_name='User',
                    name='Admin User',
                    user_rank='admin',
                    progress=100
                )
                db.session.add(admin)
                db.session.commit()
                print("✅ Admin user created successfully!")
            else:
                print("ℹ️ Admin user already exists")
                
            print("\n🎉 Database initialization complete!")
            print("\nYou can now run the application with:")
            print("  flask run")
            
        except Exception as e:
            print(f"\n❌ Database connection error: {e}")
            print("\nPlease check your MySQL database configuration:")
            print("1. Make sure XAMPP MySQL is running")
            print("2. Check your .env file for correct database credentials")
            print("3. Ensure the 'ecosphere' database exists in phpMyAdmin")
            
            # Try to determine the specific error
            if isinstance(e, pymysql.err.OperationalError):
                print("\nMySQL Error: This appears to be a MySQL connection issue.")
                print("- Is XAMPP MySQL running?")
                print("- Are your credentials correct in .env file?")
                print("- Does the 'ecosphere' database exist?")
                print("\nTo create the database:")
                print("1. Open phpMyAdmin (http://localhost/phpmyadmin)")
                print("2. Click 'SQL' tab")
                print("3. Paste the contents of ecosphere_schema.sql")
                print("4. Click 'Go' to execute")
            else:
                print("\nGeneral database error. Please check your MySQL configuration.")

if __name__ == '__main__':
    init_db()