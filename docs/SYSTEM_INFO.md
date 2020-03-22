# System Info

## Table of Contents

|                                                     |
| --------------------------------------------------- |
| [General Architecture](#general_architecture)       |
| [Client Usage](#client_usage)                       |
| [Project Structure](#project_structure)             |
| [Detection/Recognition Pipeline](#tracing_pipeline) |
| [Known Bugs](#known_bugs)                           |

---

## General Architecture <a name = "general_architecture"></a>

<p align="center">
  <a href="" rel="noopener">
 <img src="https://user-images.githubusercontent.com/13802164/77241061-8c427780-6baa-11ea-8f7e-c74417f92756.png" alt="Whiteboard Vision System Architecture"></a>
</p>

This project primarily exposes two base endpoints: the "/api" endpoint and the "/" or website root endpoint. NGINX is used to route the respective requests to their respective endpoints. All requests (except those starting with a "/api") are routed to the website root endpoint.

Behind both endpoints are Flask apps used to process the sent requests. The app behind the website root serves static assets used to render the client within a users web browser. The app behind the API endpoint accepts POST requests containing images and returns JSON containing the detection/recognition data.

## Client Usage <a name = "client_usage"></a>

Upon first loading the client, the user will be greeted with two buttons: "Record a Video" and "Upload Images". The "Record a Video" button allows the user to snap still images from a webcam connected to their computer and have detection/recognition performed on them. The "Upload Images" button allows the user to submit their own images and have detection/recognition performed on them.

Mobile users should be directed to use the "Upload Images" section as most mobile devices disallow stream-based access to cameras through a web browser.

### Record a Video

On clicking the "Record a Video" button, the client will attempt to open an accessible webcam on the user's computer. This can manifest as a prompt within the browser asking for webcam access. Accept any requests and a stream from the webcam should be visible in the browser.

The user can opt to select a given whiteboard or writing surface in a scene by clicking the four corners within the webcam video stream. This will create a green, highlighted selection.

The bottom of the video stream features two buttons: "Take Snapshot" and "Clear Selection". The "Clear Selection" button clears the currently highlighted area on the webcam video stream (if any). The "Take Snapshot" button takes the current frame or selection and sends it to the API for handwriting detection/recognition. This frame is inserted below and, when the API has finished processing the photo, results are displayed overtop.

Once at least a single frame has been processed, a "Download Data" button will appear at the top of the client. Clicking this button will generate and download a PDF of all submitted frames and their handwriting recognition results.

### Upload Images

On clicking the "Upload Images" button, the client will display an upload form to the user. Images can either be dragged into this box or, by clicking on the "selecting one" text, a user can manually specify images to upload from their file system. The second method is recommended for mobile users.

Uploaded images will appear within the browser window. Similar to the "Record a Video" section, the user can either click the four corners of a writing surface to select/crop it or the user can submit to entire image for processing. At the bottom of each uploaded image, the user can either clear any existing selection (the "Clear Selection" button) or submit the image/selection ("Detect Text in Selection").

Images or selection submitted for recognition/detection are available as tabs existing beside the original image. Results from the API are displayed within the repsective tabs. Multiple selection can be create from an image, if desired.

Once at least a single image or selection has been processed, a "Download Data" button will appear at the top of the client. Clicking this button will generate and download a PDF of all submitted images/selections and their handwriting recognition results.

## Project Structure <a name = "project_structure"></a>

The project is largely organized into 2 main directories: the "api_server" directory, which contains all logic/resources/code for the API server, and the "frontend_server" directory, which contains all logic/code/resources for the frontend server. Both directories are available at the project root. The "conf" directory serves as a mount point and repository for Certbot and NGINX configuration.

### Entry Points and Noteworthy Files in the Frontend Server

---

#### *app.py*

- Initializes the Flask app, loads the config (if available), and specifies the HTML template to load when a request is made for the website root.
- This module is imported/used in the running of both the test and production instance of the frontend server.

#### *run.py*

- Used to run a test instance of the Flask application using Flask's built-in test server. The host address and port are specified inside this file as variables.
- **Warning:** Do not use this for production purposes. Flask's built-in server is incapable of handling multiple requests at once.

#### *supervisord.conf*

- Contains the setup information for running Gunicorn (the production server WSGI used to run the frontend server Flask app in production) as a supervised process.
- Contains server scaling, backlog information, and port/host settings for Gunicorn.

#### */logs and supervisord.log*

- Contain the logs for running the frontend production instance.

#### */static*

- Contains all the static assets making up the frontend client loaded into a user's web browser.

#### */static/css/uikit.min.css*

- The boilerplate stylings for the client.
- For documentation see: https://getuikit.com/docs/introduction

#### */static/css/main.css*

- Contains custom stylings for the site
- Overrides UIkit stylings

#### */static/js/utils.js*

- Contains JS utility functions used by wv-image.js and wv-video.js
- Eg: POST AJAX request wrappers, SVG HTML element renderers, etc

#### */static/js/wv-video.js*

- Contains the JS for requesting/rendering the webcam video stream.
- Also includes functionality for requesting/rendering API results.

#### */static/js/wv-image.js*

- Contains the JS for uploading/rendering user specified images.
- Also includes functionality for requesting/rendering API results.

### Entry Points and Noteworthy Files in the API Server

---

#### *app.py*

- Initializes the Flask app, loads the config (if available), implements the API endpoints, and configures the server for CORS.
- This module is imported/used in the running of both the test and production instance of the frontend server.

#### *run.py*

- Used to run a test instance of the Flask application using Flask's built-in test server. The host address and port are specified inside this file as variables.
- **Warning:** Do not use this for production purposes. Flask's built-in server is incapable of handling multiple requests at once.

#### *api.py*

- Specifies the actions and settings behind the API endpoints.
- Implements the main image recognition endpoint which uses CRAFT and DTR.
- All results are returned as stringified JSON.

#### *supervisord.conf*

- Contains the setup information for running Gunicorn (the production server WSGI used to run the API server Flask app in production) as a supervised process.
- Contains server scaling, backlog information, and port/host settings for Gunicorn.

#### */logs and supervisord.log*

- Contain the logs for running the API server production instance.

#### */whiteboard_vision*

- Contains CRAFT, DTR, and all the logic needed to ferry data between the two to make them work in unison.

#### */whiteboard_vision/api.py*

- Contains the logic for detecting and recognizing text within an image using CRAFT and DTR. Also implements word flipping to check for better accuracy/words of different orientations.
- All results are recorded into a Python dict and then dumped to a JSON string.

#### */whiteboard_vision/imgutil.py*

- Utility functions to help with manipulating images in api.py.

#### */whiteboard_vision/clova_detection/api.py*

- The main entrypoint for exposing CRAFT's functionality as a module.

#### */whiteboard_vision/clova_recognition/api.py*

- The main entrypoint for exposing DTR's functionality as a module.

## Tracing the Detection/Recognition Pipeline <a name = "tracing_pipeline"></a>

<p align="center">
  <a href="" rel="noopener">
 <img src="https://user-images.githubusercontent.com/13802164/77244227-ffaab000-6bcf-11ea-899e-e07e3e49ca16.png" alt="Whiteboard Vision Detection/Recognition Pipeline"></a>
</p>

- The pipeline begins at the client with a user-loaded video snapshot or uploaded image.
- The user clicks the "Detect Text" button or the "Take Snapshot" button which activates "getImageSelection" (in wv-image.js) or "captureVideoFrame" in wv-video.js.
- These functions extract the respective image submitted and, if a selection is present, crop/rectify it (done in utils.js with "cropSelection").
- The image is packaged into a form request and POSTed to the API endpoint with "makeRequest" in utils.js.
- The API server recieves this request in api.py and downloads the image to a file.
- The file path is submitted to the "process_images" function in /api_server/whiteboard_vision/api.py and stringified JSON detection/recognition results are returned.
- The data is sent back to the client which begins to render these results in either "getImageSelection" or "captureVideoFrame".
- Word grouping is done on the received data with "getStructuredText" in utils.js.
- The received bounding boxes for words and sentences are drawn onto the SVG layer overtop of the submitted image or video snapshot.

## Known Bugs <a name = "known_bugs"></a>

- Users on newer iPhones (iPhone X and newer) uploading images taken straight from their phone will see their images "flip" on submitting to the API.
  - **Potential Cause:** Newer iPhones indicate the orientation of a photo through EXIF metadata (Eg: if it was taken in landscape or horizontal mode). OpenCV is likely not taking this into account and stripping the EXIF metadata when warping/cropping the photo.
  - **Potential Solution:** Manually orientate the photo with respect to the EXIF metadata (if available) before sending to OpenCV.
- Submitting many large images in quick succession to the API can have these requests dropped infrequently and 502 errors returned to the user.
  - **Potential Cause:** Gunicorn's backlog isn't catching these requests.
  - **Potential Solution:** Implement Celery or another more robust queue. Investigating uWSGI might also prove fruitful as a substitute for Gunicorn.
- Word grouping fails if sentence detection splits a legitimate sentence.
  - **Potential Cause:** Word grouping assumes all words are within sentences. If a detected word is not within a sentence, it may be dropped from recognition.
  - **Poetential Solution:** Enable larger sentence gaps in CRAFT and convert floater words with no sentence to pseudo-sentences.
