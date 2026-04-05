from flask import Flask, jsonify, url_for, render_template
import random
from datetime import datetime, time


app = Flask(__name__)


start_time = None
timer_running = False
abilities = ['Cold Snap', 'Ghost Walk', 'Ice Wall', 'EMP', 'Tornado', 
    'Alacrity', 'Sun Strike', 'Forge Spirit', 'Chaos Meteor', 'Deafening Blast']  
shuffled = abilities[:]
random.shuffle(shuffled)

@app.route('/')
def index():
    return render_template('base.html', abilities=shuffled)

@app.route('/start-timer', methods=['POST'])
def start_timer():
    global start_time, timer_running
    start_time = time.time()
    timer_running = True
    return jsonify({'status': 'timer_started'})

@app.route('/get-time', methods=['GET'])
def get_time():
    global start_time, timer_running
    if timer_running and start_time:
        elapsed = int(time.time() - start_time)
        return jsonify({'time': elapsed, 'running': True})
    return jsonify({'time': 0, 'running': False})

@app.route('/stop-timer', methods=['POST'])
def stop_timer():
    global timer_running
    timer_running = False
    return jsonify({'status': 'timer_stopped'})


if __name__ == '__main__':
    app.run(port=8080, host='127.0.0.1')    