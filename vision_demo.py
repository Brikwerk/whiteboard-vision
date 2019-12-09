import os
import cv2
import whiteboard_vision as wv

def main():
    images_path = os.path.abspath("test_images")

    # Getting all images with an acceptable extension under the given path
    image_extensions = [".png", ".jpg", ".jpeg"]
    dir_items = os.listdir(images_path)
    images = []
    for item in dir_items:
        item_path = os.path.join(images_path, item)
        if os.path.isfile(item_path):
            extension = os.path.splitext(item_path)[1]
            if extension in image_extensions:
                images.append((cv2.imread(item_path), item_path))
    if len(images) == 0:
        return images
    
    results = wv.process_images(images, debug=True)
    print(results)

if __name__ == '__main__':
    main()