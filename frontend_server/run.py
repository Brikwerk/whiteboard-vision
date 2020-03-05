from app import app


HOST = 'localhost'
PORT = 4200

if __name__ == '__main__':
    app.run(host=HOST, port=PORT)