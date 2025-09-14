import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_to_cloudinary(file, folder="ecosphere_articles"):
    """
    Upload a file to Cloudinary
    Returns: URL of the uploaded image or None if failed
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            use_filename=True,
            unique_filename=True,
            overwrite=False
        )
        return result['secure_url']
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None