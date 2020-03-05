import os

from flask import Flask

from whiteboard_vision import CraftDetection, CraftRecognition

# Initializing server
app = Flask(__name__, instance_relative_config=True)
import api

# Loading config, if available
if os.path.isfile("config.py"): 
    app.config.from_object('config')


@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response
