from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app.models import Article, log_user_activity
from app import db
from app.utils.cloudinary_upload import upload_to_cloudinary
import os
import uuid

bp = Blueprint('articles', __name__, url_prefix='/api/articles')

# Configure upload folder (for text files only - images go to Cloudinary)
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
    # Check if upload folder exists for text files
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    title = request.form.get('title')
    content = request.form.get('content')
    
    if not title or not content:
        return jsonify({'error': 'Missing required fields'}), 400
    
    image_url = None
    
    # Handle image upload to Cloudinary
    if 'image' in request.files:
        image_file = request.files['image']
        if image_file and allowed_image_file(image_file.filename):
            # Upload to Cloudinary
            image_url = upload_to_cloudinary(image_file)
            if not image_url:
                return jsonify({'error': 'Failed to upload image'}), 500
    
    # Handle text file upload (local storage)
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
        image_path=image_url  # Now stores Cloudinary URL instead of local path
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
    
    # Get form data
    title = request.form.get('title')
    content = request.form.get('content')
    
    if title:
        article.title = title
    if content:
        article.content = content
    
    # Handle image upload to Cloudinary
    if 'image' in request.files:
        image_file = request.files['image']
        if image_file and allowed_image_file(image_file.filename):
            # Upload new image to Cloudinary
            image_url = upload_to_cloudinary(image_file)
            if image_url:
                article.image_path = image_url  # Store Cloudinary URL
    
    # Handle text file upload
    if 'text_file' in request.files:
        text_file = request.files['text_file']
        if text_file and allowed_text_file(text_file.filename):
            # Read content from text file
            file_content = text_file.read().decode('utf-8')
            article.content = file_content
    
    # Handle image removal
    if request.form.get('remove_image') == 'true':
        article.image_path = None  # Just set to None, no file deletion needed
    
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
    
    # Note: With Cloudinary, we don't need to delete the image file manually
    # Cloudinary has its own management system
    
    db.session.delete(article)
    db.session.commit()
    
    return jsonify({'message': 'Article deleted successfully'})