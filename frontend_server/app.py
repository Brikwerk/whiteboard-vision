import os

from flask import Flask, render_template


# Initializing server
app = Flask(__name__, instance_relative_config=True)

# Loading config, if available
if os.path.isfile("config.py"): 
    app.config.from_object('config')


@app.route("/")
def index():
    return render_template("index.html")
