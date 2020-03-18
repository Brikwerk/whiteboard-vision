"""
frontend_server.run
~~~~~~~~~~~~~~

Contains the main logic for running the frontend_server Flask app.
"""

from app import app


HOST = 'localhost'
PORT = 4200

if __name__ == '__main__':
    app.run(host=HOST, port=PORT)