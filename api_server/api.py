"""
api_server.api
~~~~~~~~~~~~~~

Contains the main logic for routing API requests.
"""

from app import app
from flask import request
from werkzeug.utils import secure_filename
from whiteboard_vision import process_images, load_image_paths
import os, logging


@app.route("/v1/imagerecognition", methods=["POST"])
def image_recognition():
    """Recieves a POSTed image, attempts image recognition
    and returns the results as JSON.
    
    :return: Stringified JSON from image recognition/detection
     or an error. The dictionary takes the form of::

        {
            "image_name": {
                "words": {
                    0: {
                        "text": "recognized_word",
                        // How confident the recognition was
                        "score": 0.99,
                        // X/Y coords of detected bbox
                        "bbox": [[0,0],[1,0],[1,1],[0,1]]
                    } 
                },
                "sentences": [
                    // X/Y coords of detected bbox
                    [[0,0],[1,0],[1,1],[0,1]]
                ]
            }
        }

    :rtype: string
    """
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
        logging.exception("Image Upload Error")
        # Deleting uploaded images
        for path in image_paths:
            if os.path.exists(path):
                os.remove(path)
        return {"error": "An error was encountered uploading and saving your image"}
    
    try:
        # Loading files from directory and performing recognition
        images = load_image_paths(image_paths)
        results = process_images(images)

        # Deleting uploaded images
        for path in image_paths:
            os.remove(path)
    except:
        logging.exception("Image Processing Error")
        # Deleting uploaded images
        for path in image_paths:
            if os.path.exists(path):
                os.remove(path)
        return {"error": "An error was encountered processing your images"}

    return results