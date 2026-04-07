from flask import Flask, jsonify, url_for, render_template
import random
from datetime import datetime, time
import time


app = Flask(__name__)


start_time = None
timer_running = False
abilities = ['Cold Snap', 'Ghost Walk', 'Ice Wall', 'EMP', 'Tornado',
    'Alacrity', 'Sun Strike', 'Forge Spirit', 'Chaos Meteor', 'Deafening Blast']
sk1 = 'Cold Snap - Q Q Q'
sk2 = 'Ghost Walk - Q Q W'
sk3 = 'Ice Wall - Q Q E'
sk4 = 'EMP - W W W'
sk5 = 'Tornado - W W Q'
sk6 = 'Alacrity - W W E'
sk7 = 'Sun Strike - E E E'
sk8 = 'Forge Spirit - E E Q'
sk9 = 'Chaos Meteor - E E W'
sk10 = 'Deafening Blast - Q W E'
shuffled = abilities[:]
random.shuffle(shuffled)

@app.route('/')
def index():
    return render_template('base.html', abilities=shuffled)

@app.route('/start-timer')
def start_timer():
    global start_time, timer_running
    start_time = time.time()
    timer_running = True
    return jsonify({'status': 'ok'})

@app.route('/get-time')
def get_time():
    global start_time, timer_running
    if timer_running and start_time:
        elapsed = time.time() - start_time
        return jsonify({'time': elapsed})
    return jsonify({'time': 0})

@app.route('/stop-timer')
def stop_timer():
    global timer_running
    timer_running = False
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(port=8080, host='127.0.0.1')
