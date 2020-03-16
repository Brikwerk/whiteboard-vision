# Whiteboard Vision

## Description

This project aims to detect and transcribe text written on a whiteboard in a classroom environment. Handwritten athematical equations and drawn diagrams will not be targetted as an area for transcription.

A client-server relationship is leveraged to achieve functionality. Docker is used to host the server components and deliver the client-side assets to a user's web browser. Text detection and text recognition is achieved through usage of two neural networks running on the server.

## Server Requirements

*Please Note:* PyTorch is used to load the neural network models and weights in Docker.

- (If using a CPU to run the models) Equivalent to a 7th Generation Intel i7 or greater.
- (If using a GPU to run the models) Equivalent to a GTX 1060 or greater.
- At least 4GB of RAM
- Docker >=v2.1.0.5
- Docker Compose >=v1.25.4
- Approx 4GB of space

## Project Setup

1. Clone this repository to an optimal location on the server

    ```bash
    git clone https://www.github.com/Brikwerk/whiteboard-vision
    ```

2. For evaluation purposes, pre-trained weights are available for usage with the CRAFT and DTR neural networks inside this project. These weights, however, need to be downloaded.

    The weights required for CRAFT to function can be downloaded [HERE (Main Weights)](https://drive.google.com/open?id=1Jk4eGD7crsqCCg9C9VjCLkMN3ze8kutZ) and [HERE (Refiner Weights)](https://drive.google.com/open?id=1XSaFwBkOaFOdtk4Ane3DFyJGPRw6v5bO).

    The weights required for DTR to function can be downloaded [HERE](https://drive.google.com/file/d/1b59rXuGGmKne1AuHnkgDzoYgKeETNMv9/view).

    Both of the CRAFT/DTR and their respective pre-trained models are available thanks to Clova AI's research. For those interested: [CRAFT](https://github.com/clovaai/CRAFT-pytorch) and [DTR](https://github.com/clovaai/deep-text-recognition-benchmark).

3. Once the above weights are downloaded, you should have three files:
    - craft_mlt_25k.pth
    - craft_refiner_CTW1500.pth
    - TPS-ResNet-BiLSTM-Attn.pth

    Inside the whiteboard-vision project, place the weights "craft_mlt_25k.pth" and "craft_refiner_CTW1500.pth" in the location "api_server/whiteboard_vision/clova_detection/weights" and the weight "TPS-ResNet-BiLSTM-Attn.pth" in the location "api_server/whiteboard_vision/clova_recognition/weights".

4. Make a copy of the "example_config.py" file within the "frontend_server" directory and rename it to "config.py".

5. Make a copy of the "example_config.py" file within the "api_server" directory and rename it to "config.py".

6. Make a copy of the "example_nginx_http.conf" file within the "conf" directory and rename it to "nginx.conf".

## Running a Testing Server

**Note:** Make sure to complete the "Project Setup" section before looking at this section.

If you wish to run a development instance of this project with debug features enabled, this section is for you.

1. Edit both "config.py" files within the "api_server" and "frontend_server" directories so that the DEBUG, ENV, and TESTING variables match the following:

    ```python
    DEBUG = True
    ENV = 'development'
    TESTING = True
    ```

    **Note:** Do *not* delete the API_ENDPOINT variable in the "frontend_testing" config.

2. With a console at the root of this project, run the following command:

    ```bash
    docker-compose up
    ```

    This will start NGINX, the API server, the frontend server, and Certbot (which can be ignored) in Docker with an overview of what's going on. **Please Note:** The build process for the API server can take some time, depending on system/internet speed.

3. The frontend client should now be accessible over the browser through the url http://localhost

    Changes to the Python files in either project will appropriately reload the respective servers.

## Running a Production Server

**Note:** Make sure to complete the "Project Setup" section before looking at this section.

If you wish to run an online, production instance of this server, this section is for you. An assumption is made going forward that a URL is available for usage on the server.

1. Open up the "nginx.conf" file under the "conf" directory and replace any instance of "localhost" (quotes excluded) with the URL you will be hosting the server under. An example is provided below:

    ```
    server {
      listen 80;
      server_name INSERT.URL.HERE;

    ...
    ```

2. To enable access to a users webcam for usage in the client, an SSL certificate is required. To get an SSL certificate through LetsEncrypt, edit the certbot script located at the root of the project with your information and run it.

    If you are on Linux or Mac, edit the "certbot.sh" script. If you are on Windows, edit the "certbot.bat" script. An example of a filled in Linux/Mac script is provided below:

    ```bash
    docker-compose run --rm --entrypoint\
    "certbot certonly --webroot -w /var/www/certbot \
    --email email@example.org \
    -d example.org \
    --rsa-key-size 4096 \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

    docker stop nginx
    ```

    After you have finished filling out the script, run it with the respective command:

    Linux/Mac:

    ```bash
    ./certbot.sh
    ```

    Windows:

    ```cmd
    certbot.bat
    ```

    The script will run the Certbot docker image and attempt to grant an SSL certificate to the specified domain. A "Congratulations" notice will be listed first under the "Important Notes" section in your terminal after the script as finished running.

3. Delete the "nginx.conf" file located in the "conf" directory. Next, make a copy of the "example_nginx_https.conf" and rename it to "nginx.conf". Repeat step 1 with this file, replacing any instances of "localhost" (quotes excluded) with your domain name.

4. Run the following to boot the server

    ```bash
    docker-compose up -d
    ```

    The server should now be running securely under the specified domain.

## Future Improvements

- Improved word grouping and sentence grouping
  - Word grouping can fail in adverse scenarios (words forgotten). Inclusion of words needs to be looked into if sentence gathering fails.
  - Sentence grouping can fail when words are further apart. This can be solved by tweaking the config values within CRAFT.
- API server scaling needs to be improved/investigated
  - A 502 error can still occur in periods of heavy image submission. This needs to be investigated and proper solutions applied. A solution could involve usage of Celery for querying backlogging and uWSGI, instead of Gunicorn, for better scaling.