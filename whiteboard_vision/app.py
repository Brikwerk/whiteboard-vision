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

from .clova_detection.api import CraftDetection
from .clova_recognition.api import CraftRecognition
from . import imgutil

def process_images(images_path, debug=False):
    # Loading models
    detection = CraftDetection(debug=debug)
    recognition = CraftRecognition()

    # Getting all images with an acceptable extension under the given path
    image_extensions = [".png", ".jpg", ".jpeg"]
    dir_items = os.listdir(images_path)
    files = []
    for item in dir_items:
        item_path = os.path.join(images_path, item)
        if os.path.isfile(item_path):
            extension = os.path.splitext(item_path)[1]
            if extension in image_extensions:
                files.append(item_path)
    if len(files) == 0:
        return files
    
    bboxes = []
    for image_path in files:
        print("Getting text in image %s" % image_path)
        # Detecting text and getting bounding boxes
        boxes, polys = detection.detect_text(image_path)
        image = cv2.imread(image_path)
        
        count = 0
        bboxes = []
        results_image = image
        for box in boxes:
            bbox_image = imgutil.crop_rectangle(box, image)
            bbox_image_pillow = Image.fromarray(cv2.cvtColor(bbox_image, cv2.COLOR_BGR2RGB))
            bboxes.append(bbox_image_pillow)
            bbox_image_path = "./bbox_results/%s_%s.jpg" % (os.path.basename(image_path), count)
            print("Working on Bounding Box %d" % count)

            if debug:
                # Saving bounding boxes
                count = count + 1
                if not os.path.exists("./bbox_results"):
                    os.makedirs("./bbox_results")
                cv2.imwrite(bbox_image_path, bbox_image)

            width, height = bbox_image_pillow.size
            # Rotating image clockwise if it's too tall
            ratio = width/height
            rotated = False
            if ratio < 0.66:
                print("Image too tall, sideways text likely, rotating...")
                bbox_image_pillow = bbox_image_pillow.rotate(90, expand=True)
                rotated = True
            
            # An array is returned with [[prediction, score]]
            results = recognition.recognize_text([bbox_image_pillow])
            # If the returned score is too low, attempt with different orientations
            if results[0][1] < 0.7:
                print("Retrying with different orientation due to low score")
                # If we already rotated the image
                if rotated:
                    retry_image = bbox_image_pillow.rotate(180, expand=True)
                    retry = recognition.recognize_text([retry_image])
                    # If we get a higher confidence score
                    if retry[0][1] > results[0][1]:
                        results = retry
                else:
                    # Going through three other orientations and taking best score
                    for i in range(0, 3):
                        retry_image = bbox_image_pillow.rotate(90*i, expand=True)
                        # If we have an image that has tall word,
                        # Skip it as it's likely the wrong orientation
                        retry_width, retry_height = retry_image.size
                        if retry_width/retry_height < 0.66:
                            continue
                        retry = recognition.recognize_text([retry_image])
                        # If we get a higher confidence score
                        if retry[0][1] > results[0][1]:
                            results = retry
            
            if debug:
                results_image = imgutil.draw_results(box, results[0][0], float(results[0][1]), results_image)
        
        if debug:
            results_image_path = "./results/%s_%s.jpg" % (os.path.basename(image_path), "results")
            if not os.path.exists("./results"):
                    os.makedirs("./results")
            cv2.imwrite(results_image_path, results_image)
    
    return images_path
