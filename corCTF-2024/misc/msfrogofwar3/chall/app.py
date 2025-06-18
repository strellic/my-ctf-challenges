from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit
from stockfish import Stockfish
import random

import chess
from stockfish import Stockfish

games = {}

toxic_msges = [
    "?",
    "rip bozo",
    "so bad lmfaoo",
    "ez",
    "skill issue",
    "mad cuz bad",
    "hold this L",
    "L + ratio + you fell off",
    "i bet your main category is stego",
    "have you tried alt+f4?",
    "🤡🤡🤡"
]

win_msges = [
    "lmaooooooooo ur so bad",
    "was that it?",
    "zzzzzzzzzzzzzzzzzzzzzz",
    "hopefully the next game wont be so quick",
    "nice try - jk that was horrible",
    "this aint checkers man"
]

TURN_LIMIT = 15
STOCKFISH_DEPTH = 21
FLAG = "corctf{this_is_a_fake_flag}"

class GameWrapper:
    def __init__(self, emit):
        self.emit = emit
        self.board = chess.Board(chess.STARTING_FEN)
        self.moves = []
        self.player_turn = True

    def get_player_state(self):
        legal_moves = [f"{m}" for m in self.board.legal_moves] if self.player_turn and self.board.fullmove_number < TURN_LIMIT else []

        status = "running"
        if self.board.fullmove_number >= TURN_LIMIT:
            status = "turn limit"

        if outcome := self.board.outcome():
            if outcome.winner is None:
                status = "draw"
            else:
                status = "win" if outcome.winner == chess.WHITE else "lose"

        return {
            "pos": self.board.fen(),
            "moves": legal_moves,
            "your_turn": self.player_turn,
            "status": status,
            "turn_counter": f"{self.board.fullmove_number} / {TURN_LIMIT} turns"
        }

    def play_move(self, uci):
        if not self.player_turn:
            return
        if self.board.fullmove_number >= TURN_LIMIT:
            return
        
        self.player_turn = False

        outcome = self.board.outcome()
        if outcome is None:
            try:
                move = chess.Move.from_uci(uci)
                if move:
                    if move not in self.board.legal_moves:
                        self.player_turn = True
                        self.emit('state', self.get_player_state())
                        self.emit("chat", {"name": "System", "msg": "Illegal move"})
                        return
                    self.board.push_uci(uci)
            except:
                self.player_turn = True
                self.emit('state', self.get_player_state())
                self.emit("chat", {"name": "System", "msg": "Invalid move format"})
                return
        elif outcome.winner != chess.WHITE:
            self.emit("chat", {"name": "🐸", "msg": "you lost, bozo"})
            return

        self.moves.append(uci)

        # stockfish has a habit of crashing
        # The following section is used to try to resolve this
        opponent_move, attempts = None, 0
        while not opponent_move and attempts <= 10:
            try:
                attempts += 1
                engine = Stockfish("./stockfish/stockfish-ubuntu-x86-64-avx2", parameters={"Threads": 4}, depth=STOCKFISH_DEPTH)
                for m in self.moves:
                    if engine.is_move_correct(m):
                        engine.make_moves_from_current_position([m])
                opponent_move = engine.get_best_move_time(3_000)
            except:
                pass

        if opponent_move != None:
            self.moves.append(opponent_move)
            opponent_move = chess.Move.from_uci(opponent_move)
            if self.board.is_capture(opponent_move):
                self.emit("chat", {"name": "🐸", "msg": random.choice(toxic_msges)})
            self.board.push(opponent_move)
            self.player_turn = True
            self.emit("state", self.get_player_state())

            if (outcome := self.board.outcome()) is not None:
                if outcome.termination == chess.Termination.CHECKMATE:
                    if outcome.winner == chess.BLACK:
                        self.emit("chat", {"name": "🐸", "msg": "Nice try... but not good enough 🐸"})
                    else:
                        self.emit("chat", {"name": "🐸", "msg": "how??????"})
                        self.emit("chat", {"name": "System", "msg": FLAG})
                else: # statemate, insufficient material, etc
                    self.emit("chat", {"name": "🐸", "msg": "That was close... but still not good enough 🐸"})
        else:
            self.emit("chat", {"name": "System", "msg": "An error occurred, please restart"})

app = Flask(__name__, static_url_path='', static_folder='static')
socketio = SocketIO(app, cors_allowed_origins='*')

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'max-age=604800'
    return response

@app.route('/')
def index_route():
    return render_template('index.html')

@socketio.on('connect')
def on_connect(_):
    games[request.sid] = GameWrapper(emit)
    emit('state', games[request.sid].get_player_state())

@socketio.on('disconnect')
def on_disconnect():
    if request.sid in games:
        del games[request.sid]

@socketio.on('move')
def onmsg_move(move):
    try:
        games[request.sid].play_move(move)
    except:
        emit("chat", {"name": "System", "msg": "An error occurred, please restart"})

@socketio.on('state')
def onmsg_state():
    emit('state', games[request.sid].get_player_state())