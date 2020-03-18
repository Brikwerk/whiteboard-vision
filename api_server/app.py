"""
api_server.app
~~~~~~~~~~~~~~

Contains the main logic for setting up the api_server Flask app.
"""

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
  """Modifies request to allow for Cross Origin API requests
  
  :param response: Flask Response to a Request
  :type response: response
  :return: Flask Response
  :rtype: response
  """
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response
