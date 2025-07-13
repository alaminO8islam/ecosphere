import os
from dotenv import load_dotenv


import os
from app import create_app
from flask import send_from_directory

app = create_app()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

@app.route('/')
def root():
    return send_from_directory(os.path.join(BASE_DIR, 'app', 'static'), 'index.html')

@app.route('/app/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'app', 'static'), filename)

if __name__ == '__main__':
    app.run(debug=True)