"""
frontend_server.run_tests
~~~~~~~~~~~~~~~~~~~~~~~~~

Contains the main logic for running the frontend_server testing server Flask app.
"""

import threading, webbrowser

from flask import Flask, render_template, send_from_directory


app = Flask(__name__)
@app.route('/')
def index_render():
    return render_template("specRunner.html")


@app.route('/jasmine/<path:path>')
def send_jasmine(path):
    return send_from_directory('jasmine', path)


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


@app.route('/spec/<path:path>')
def send_spec(path):
    return send_from_directory('spec', path)


if __name__ == '__main__':
    # Opening testing webpage in browser window after 1.25s
    url = "http://localhost:4200"
    threading.Timer(1.25, lambda: webbrowser.open(url)).start()

    # Running the webserver
    app.run(host="localhost", port=4200, debug=False)