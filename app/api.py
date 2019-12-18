from app import app
from flask import request
from werkzeug import secure_filename
from whiteboard_vision import process_images, load_image_paths
import os


@app.route("/api/v1/imagerecognition", methods=["POST"])
def image_recognition():
    try:
        # Saving files to a directory
        image_dict = request.files.to_dict()
        image_paths = []
        for image_key in image_dict:
            f = image_dict[image_key]
            filename = secure_filename(image_key)

            # Checking if uploads directory is available
            # If not, creating
            if not os.path.exists("./uploads"):
                os.makedirs("./uploads")
            
            # Saving image with secure filename
            image_path = os.path.join("./uploads", filename)
            image_paths.append(image_path)
            f.save(image_path)
    except:
        return {"error": "An error was encountered uploading and saving your image"}
    
    try:
        # Loading files from directory and performing recognition
        images = load_image_paths(image_paths)
        results = process_images(images)

        # Deleting uploaded images
        for path in image_paths:
            os.remove(path)
    except:
        return {"error": "An error was encountered processing your images"}

    return results