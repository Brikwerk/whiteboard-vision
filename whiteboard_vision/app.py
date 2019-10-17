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

def process_images(images_path):
    # Getting all images with an acceptable extension under the given path
    image_extensions = [".png", ".jpg", ".jpeg", ".tiff"]
    files = [os.path.join(images_path, file_name) for file_name in os.listdir(images_path)
                if any(file_name.endswith(extension) for extension in images_path)]
    if len(files) == 0:
        return []
    
    bboxes = []
    for image_path in files:
        boxes, polys = detect_text(image_path)
        image = cv2.imread(image_path)

        for box in boxes:
            print(box)
            print(box[0][0], box[1][0], box[0][1], box[2][1])
            cropped_image = image[int(box[0][0]):int(box[1][0]), int(box[0][0]):int(box[2][1])]
            cv2.imshow("Image", cropped_image)
            cv2.waitKey(0)
            break
    
    return images_path
