from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app.models import Article, log_user_activity
from app import db
import os
import uuid

bp = Blueprint('articles', __name__, url_prefix='/api/articles')

# Configure upload folder
UPLOAD_FOLDER = os.path.join('app', 'static', 'uploads')
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
ALLOWED_TEXT_EXTENSIONS = {'txt'}

def allowed_image_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_text_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_TEXT_EXTENSIONS

@bp.route('/', methods=['GET'])
@login_required
def get_articles():
    articles = Article.query.order_by(Article.created_at.desc()).all()
    
    result = []
    for article in articles:
        result.append(article.to_dict())
    
    return jsonify(result)

@bp.route('/user', methods=['GET'])
@login_required
def get_user_articles():
    articles = Article.query.filter_by(user_id=current_user.id).order_by(Article.created_at.desc()).all()
    
    result = []
    for article in articles:
        result.append(article.to_dict())
    
    return jsonify(result)

@bp.route('/<int:article_id>', methods=['GET'])
@login_required
def get_article(article_id):
    article = Article.query.filter_by(id=article_id).first()
    
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    return jsonify(article.to_dict())

@bp.route('/', methods=['POST'])
@login_required
def create_article():
    # Check if upload folder exists, if not create it
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    title = request.form.get('title')
    content = request.form.get('content')
    
    if not title or not content:
        return jsonify({'error': 'Missing required fields'}), 400
    
    image_path = None
    
    # Handle image upload
    if 'image' in request.files:
        image_file = request.files['image']
        if image_file and allowed_image_file(image_file.filename):
            # Generate unique filename
            filename = secure_filename(image_file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            image_file.save(file_path)
            image_path = f"/static/uploads/{unique_filename}"
    
    # Handle text file upload
    if 'text_file' in request.files:
        text_file = request.files['text_file']
        if text_file and allowed_text_file(text_file.filename):
            # Read content from text file
            file_content = text_file.read().decode('utf-8')
            # If content is empty, use the text file content
            if not content.strip():
                content = file_content
    
    new_article = Article(
        user_id=current_user.id,
        title=title,
        content=content,
        image_path=image_path
    )
    
    db.session.add(new_article)
    db.session.commit()
    
    # Log user activity
    log_user_activity(current_user.id, 'article_create')
    
    return jsonify(new_article.to_dict()), 201

@bp.route('/<int:article_id>', methods=['PUT'])
@login_required
def update_article(article_id):
    article = Article.query.filter_by(id=article_id, user_id=current_user.id).first()
    
    if not article:
        return jsonify({'error': 'Article not found or you do not have permission to edit it'}), 404
    
    # Check if upload folder exists, if not create it
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    # Get form data
    title = request.form.get('title')
    content = request.form.get('content')
    
    if title:
        article.title = title
    if content:
        article.content = content
    
    # Handle image upload
    if 'image' in request.files:
        image_file = request.files['image']
        if image_file and allowed_image_file(image_file.filename):
            # Delete old image if it exists
            if article.image_path:
                old_file_path = os.path.join(current_app.root_path, article.image_path.lstrip('/'))
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
            
            # Generate unique filename
            filename = secure_filename(image_file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            image_file.save(file_path)
            article.image_path = f"/static/uploads/{unique_filename}"
    
    # Handle text file upload
    if 'text_file' in request.files:
        text_file = request.files['text_file']
        if text_file and allowed_text_file(text_file.filename):
            # Read content from text file
            file_content = text_file.read().decode('utf-8')
            article.content = file_content
    
    # Handle image removal
    if request.form.get('remove_image') == 'true' and article.image_path:
        old_file_path = os.path.join(current_app.root_path, article.image_path.lstrip('/'))
        if os.path.exists(old_file_path):
            os.remove(old_file_path)
        article.image_path = None
    
    db.session.commit()
    
    # Log user activity
    log_user_activity(current_user.id, 'article_update')
    
    return jsonify(article.to_dict())

@bp.route('/<int:article_id>', methods=['DELETE'])
@login_required
def delete_article(article_id):
    article = Article.query.filter_by(id=article_id, user_id=current_user.id).first()
    
    if not article:
        return jsonify({'error': 'Article not found or you do not have permission to delete it'}), 404
    
    # Delete the image file if it exists
    if article.image_path:
        file_path = os.path.join(current_app.root_path, article.image_path.lstrip('/'))
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.session.delete(article)
    db.session.commit()
    
    return jsonify({'message': 'Article deleted successfully'})