"""
api_server.vision_demo
~~~~~~~~~~~~~~~~~~~~~~

A one-off script for testing text detection/recogntion.
"""

import os
import whiteboard_vision as wv

def main():
    images_path = os.path.abspath("test_images")
    images = wv.load_image_dir(images_path)
    if len(images) == 0: return
    
    results = wv.process_images(images, debug=True)
    print(results)

if __name__ == '__main__':
    main()