FROM ubuntu:20.04

# Set working directory
ADD . /app
WORKDIR /app

# Update sources and install dependencies
RUN apt-get update
RUN apt-get install -y python3 python3-dev python3-pip supervisor
# OpenCV dependency fix
RUN apt-get install -y libsm6 libxext6 libxrender-dev libglib2.0-0
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

RUN apt-get update && apt-get install -y supervisor

# Configure supervisor
COPY supervisord.conf /etc/supervisord.conf

# For flask web server
EXPOSE 8081

# Start flask frontend with supervisor
CMD ["supervisord", "-c", "/etc/supervisord.conf"]