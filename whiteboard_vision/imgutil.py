"""
whiteboard_vision.imgutil
~~~~~~~~~~~~~~~~~~~~~~~~~

Contains the main logic for processing images.
"""

from math import hypot

import numpy as np
import cv2


def crop_rectangle(bbox, image):
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


def detect_whiteboard(image):
    adjusted = brightness_contrast(image, brightness=-120, contrast=70)
    # Enhancement
    gray = cv2.cvtColor(adjusted, cv2.COLOR_BGR2GRAY)

    #blur = cv2.medianBlur(gray, 11)
    blur = cv2.bilateralFilter(gray,9,75,75)
    #blur = cv2.GaussianBlur(gray,(5,5),0)

    ret3, thresh = cv2.threshold(blur,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

    kernel = np.ones((5,5),np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    edges = cv2.Canny(thresh, 75, 200)

    # Dilation
    kernel = np.ones((3,3), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=1)

    # Finding largest contour
    _, contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:20]
    #cv2.drawContours(image, contours, -1, 255, 3)

    # Filtering contours
    wb_contour = None
    height, width = image.shape[:2]
    image_area = height * width
    bboxes = []
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx_polygon = cv2.approxPolyDP(c, 0.1 * peri, True)
        if len(approx_polygon) == 4 and cv2.contourArea(c) > image_area*0.05:
            points = get_polygon_points(approx_polygon)
            points = order_points(points)
            # Checking if we already have the contour
            if not approx_points_exist(points, bboxes):
                bboxes.append(points)

    return np.array(bboxes)


def get_polygon_points(polygon):
    points = []
    for point in polygon:
        points.append(point[0])
    return np.array(points)


# Following function adapted from original work by Adrian Rosebrock
# under the MIT license on PyImageSearch:
# https://www.pyimagesearch.com/2014/08/25/4-point-opencv-getperspective-transform-example/
# Original Function: Copyright (c) 2014 Adrian Rosebrock
def order_points(points):
    ordered_points = np.zeros((4, 2), dtype= "float32")

    summation = points.sum(axis = 1)
    ordered_points[0] = points[np.argmin(summation)]
    ordered_points[2] = points[np.argmax(summation)]

    difference = np.diff(points, axis = 1)
    ordered_points[1] = points[np.argmin(difference)]
    ordered_points[3] = points[np.argmax(difference)]

    return ordered_points


def approx_points_exist(new_points, existing_points):
    for points in existing_points:
        diff_x = new_points[0][0] - points[0][0]
        diff_y = new_points[0][1] - points[0][1]
        if (diff_x + diff_y) < 30:
            return True
    return False


def brightness_contrast(image, brightness = 0, contrast = 0):

    # Create a copy of the image due to destructive changes
    adjusted_image = image.copy()

    if brightness != 0:
        # Increasing image brightness
        if brightness > 0:
            alpha = (255 - brightness)/255
            gamma = brightness
        # Decreasing image brightness
        else:
            alpha = (255 + brightness)/255
            gamma = 0

        adjusted_image = cv2.addWeighted(image, alpha, image, 0, gamma)

    if contrast != 0:
        # Calculating contrast correction factor
        correction_factor = 131*(contrast + 127)/(127*(131-contrast))
        alpha = correction_factor
        gamma = 127*(1-correction_factor)

        adjusted_image = cv2.addWeighted(adjusted_image, alpha, adjusted_image, 0, gamma)

    return adjusted_image


# Copyright (c) 2014 Adrian Rosebrock under MIT License
# Adapted from the following blog post
# https://www.pyimagesearch.com/2014/08/25/4-point-opencv-getperspective-transform-example/
def four_point_transform(image, pts):
    # obtain a consistent order of the points and unpack them
    # individually
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # compute the width of the new image, which will be the
    # maximum distance between bottom-right and bottom-left
    # x-coordiates or the top-right and top-left x-coordinates
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    # compute the height of the new image, which will be the
    # maximum distance between the top-right and bottom-right
    # y-coordinates or the top-left and bottom-left y-coordinates
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    # now that we have the dimensions of the new image, construct
    # the set of destination points to obtain a "birds eye view",
    # (i.e. top-down view) of the image, again specifying points
    # in the top-left, top-right, bottom-right, and bottom-left
    # order
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype = "float32")

    # compute the perspective transform matrix and then apply it
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    # return the warped image
    return warped
