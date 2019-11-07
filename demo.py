import os
import whiteboard_vision as wv

def main():
    demo_images_path = os.path.abspath("test_images")
    results = wv.process_images(demo_images_path, debug=True)
    print(results)

if __name__ == '__main__':
    main()