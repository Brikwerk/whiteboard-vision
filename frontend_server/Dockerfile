FROM ubuntu:20.04

# Set working directory
ADD . /app
WORKDIR /app

# Update sources and install dependencies
RUN apt-get update
RUN apt-get install -y python3 python3-dev python3-pip supervisor
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

# Configure supervisor
COPY supervisord.conf /etc/supervisord.conf

# For flask web server
EXPOSE 4200

# Start flask frontend with supervisor
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
