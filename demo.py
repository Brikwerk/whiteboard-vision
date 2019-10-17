import os
import whiteboard_vision as wv

demo_images_path = os.path.abspath("test_images")
results = wv.process_images(demo_images_path)
print(results)