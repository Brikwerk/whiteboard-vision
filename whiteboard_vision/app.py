"""
whiteboard_vision.app
~~~~~~~~~~~~~~~~~~~~~

Contains the main logic for processing media and outputting
the text contained within the media.
"""

import os
import glob

import cv2
import numpy as np
from PIL import Image

from .clova_detection.api import detect_text
from .clova_recognition.api import recognize_text
from . import imgutil

def process_images(images_path):
    # Getting all images with an acceptable extension under the given path
    image_extensions = [".png", ".jpg", ".jpeg", ".tif"]
    files = [os.path.join(images_path, file_name) for file_name in os.listdir(images_path)
                if any(file_name.endswith(extension) for extension in images_path)]
    if len(files) == 0:
        return []
    
    bboxes = []
    for image_path in files:
        boxes, polys = detect_text(image_path)
        image = cv2.imread(image_path)

        count = 0
        for box in boxes:
            bbox_image = imgutil.crop_rectangle(box, image)
            bbox_image_path = "./bbox_results/%s_%s.jpg" % (os.path.basename(image_path), count)
            count = count + 1
            if not os.path.exists("./bbox_results"):
                os.makedirs("./bbox_results")
            cv2.imwrite(bbox_image_path, bbox_image)
    
    return images_path
