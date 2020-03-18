"""
api_server
~~~~~~~~~~~~~~~~~~~~~

A Flask app for recognizing and detecting text
on whiteboards.

:copyright: 2020 Reece Walsh
:license: GNU-GPL-3.0
"""

from flask import Flask
import os.path


# Initializing server
app = Flask(__name__, instance_relative_config=True)
from app import views
from app import api

# Loading config, if available
if os.path.isfile("config.py"): 
    app.config.from_object('config')
