from flask import Flask
import os.path


# Initializing server
app = Flask(__name__, instance_relative_config=True)
from app import views
from app import api

# Loading config, if available
if os.path.isfile("config.py"): 
    app.config.from_object('config')
