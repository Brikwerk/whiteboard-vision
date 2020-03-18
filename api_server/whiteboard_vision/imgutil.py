"""
whiteboard_vision.imgutil
~~~~~~~~~~~~~~~~~~~~~~~~~

Contains the main logic for processing images.
"""

from math import hypot

import numpy as np
import os
import cv2


def load_image_dir(images_dir):
    """Loads all images from a folder into a list of
    (OpenCV Image, Image Path) tuples.
    
    :param images_dir: The path to the image folder
    as a string.
    :type images_dir: string
    :return: A list of (OpenCV Image, Image Path) tuples
    :rtype: list
    """

    # Getting all images with an acceptable extension under the given path
    image_extensions = [".png", ".jpg", ".jpeg"]
    dir_items = os.listdir(images_dir)
    images = []
    for item in dir_items:
        item_path = os.path.join(images_dir, item)
        if os.path.isfile(item_path):
            extension = os.path.splitext(item_path)[1]
            if extension in image_extensions:
                images.append((cv2.imread(item_path), item_path))
    
    return images


def load_image_paths(image_paths):
    """Loads a list of image paths into a list of
    (OpenCV Image, Image Path) tuples.
    
    :param images_paths: A list of image paths
    :type images_path: list
    :return: A list of (OpenCV Image, Image Path) tuples
    :rtype: list
    """

    image_extensions = [".png", ".jpg", ".jpeg"]
    images = []
    for item_path in image_paths:
        if os.path.isfile(item_path):
            extension = os.path.splitext(item_path)[1]
            if extension in image_extensions:
                images.append((cv2.imread(item_path), item_path))
    
    return images


def crop_rectangle(bbox, image):
    """Crops and rectifies a given bounding box within an image.
    
    :param bbox: A list of 4 X/Y points within the image
    :type bbox: list
    :param image: An OpenCV image
    :type image: numpy.ndarray
    :return: The cropped/rectified image
    :rtype: numpy.ndarray
    """

    # Getting width and height of the rectangle.
    # Assuming the first coord is the top left point
    # of the rectangle and next points follow in a
    # clockwise direction.
    width = int(hypot(bbox[0][0] - bbox[1][0], bbox[0][1] - bbox[1][1]))
    height = int(hypot(bbox[0][0] - bbox[3][0], bbox[0][1] - bbox[3][1]))

    # Generating orientated rectangle from the
    # contours of the bounding box
    contours = np.array(bbox)
    rect = cv2.minAreaRect(contours)

    # Fixing angle and recreating box with width and height
    # relative to the given bounding box points.
    angle = rect[2]
    if angle < -45:
        angle = angle + 90
    rect = (rect[0], (width, height), angle)

    # Get the four points around the rotated rectangle
    # A note about the boxPoints() function:
    #   boxPoints() returns an ndarray with the first set of
    #   points representing the bottom left in the box.
    #   The next point is the one you would get if you moved
    #   around the box in a clockwise motion.
    source_points = np.float32(cv2.boxPoints(rect))

    # Getting the destination points of the new straightened image
    # These points need to match the order denoted in the boxPoints()
    # function: bottom left, top left, top right, bottom right.
    bottom_left = [0, height-1]
    top_left = [0, 0]
    top_right = [width-1, 0]
    bottom_right = [width-1, height-1]
    dest_points = np.float32([bottom_left, top_left, top_right, bottom_right])

    # Get the perspective transformation matrix and warp
    rotation_matrix = cv2.getPerspectiveTransform(source_points, dest_points)
    rotated_image = cv2.warpPerspective(image, rotation_matrix, (width, height))
    return rotated_image


def draw_results(bbox, text, score, image):
    """Draws green bboxes with detection/recognition info on a given image.
    
    :param bbox: A list of 4 X/Y coords
    :type bbox: list
    :param text: The recognized text
    :type text: string
    :param score: The certainty of the recognized text
    :type score: float
    :param image: An OpenCV image
    :type image: numpy.ndarray
    :return: An annotated OpenCV image
    :rtype: numpy.ndarray
    """

    # Drawing bounding box
    colour_green = (38,255,14)
    colour_black = (0,0,0)
    contour = np.array(bbox)
    x, y, w, h = cv2.boundingRect(contour)
    image = cv2.rectangle(image, (x, y), (x + w, y + h), colour_green, 5)

    # Drawing text background and text
    font_scale = 1.2
    font = cv2.FONT_HERSHEY_SIMPLEX
    text = (text + " " + str(round(score*100,2)) + "%")
    (text_width, text_height) = cv2.getTextSize(text, font, fontScale=font_scale, thickness=4)[0]

    box_coords = ((x-5, y), (x + text_width + 5, y - (text_height + 35)))
    cv2.rectangle(image, box_coords[0], box_coords[1], colour_green, cv2.FILLED)

    cv2.putText(image, text, (x, y-20), font, fontScale=font_scale, color=colour_black, thickness=4)

    return image

