"""
whiteboard_vision
~~~~~~~~~~~~~~~~~~~~~

A library for text detection and recognition.

:copyright: 2020 Reece Walsh
:license: GNU-GPL-3.0
"""

from .api import process_images
from .imgutil import load_image_dir
from .imgutil import load_image_paths
from .clova_detection.api import CraftDetection
from .clova_recognition.api import CraftRecognition