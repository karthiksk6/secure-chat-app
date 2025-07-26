from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

user_keys = {}  # username -> public_key

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('register_key')
def handle_register(data):
    user_keys[data['username']] = data['public_key']

@socketio.on('get_public_key')
def handle_key_request(data):
    recipient = data['recipient']
    if recipient in user_keys:
        emit('receive_public_key', {
            'recipient': recipient,
            'public_key': user_keys[recipient]
        }, broadcast=False)

@socketio.on('send_encrypted')
def handle_encrypted(data):
    emit('receive_encrypted', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)
