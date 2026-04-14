from flask import Flask, jsonify, render_template, session
import random
import time
from functools import wraps

app = Flask(__name__)
app.secret_key = 'invoker_secret_key_12345'

start_time = None
timer_running = False

# Соответствие способностей и комбинаций клавиш
ability_combinations = {
    'Cold Snap': ['Q', 'Q', 'Q'],
    'Ghost Walk': ['Q', 'Q', 'W'],
    'Ice Wall': ['Q', 'Q', 'E'],
    'EMP': ['W', 'W', 'W'],
    'Tornado': ['W', 'W', 'Q'],
    'Alacrity': ['W', 'W', 'E'],
    'Sun Strike': ['E', 'E', 'E'],
    'Forge Spirit': ['E', 'E', 'Q'],
    'Chaos Meteor': ['E', 'E', 'W'],
    'Deafening Blast': ['Q', 'W', 'E']
}

abilities = list(ability_combinations.keys())
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

@app.route('/check-combination', methods=['POST'])
def check_combination():
    from flask import request
    data = request.json
    ability = data.get('ability')
    combination = data.get('combination')
    
    if ability in ability_combinations:
        is_correct = ability_combinations[ability] == combination
        return jsonify({
            'correct': is_correct,
            'expected': ' → '.join(ability_combinations[ability]),
            'got': ' → '.join(combination)
        })
    return jsonify({'correct': False, 'error': 'Ability not found'})

if __name__ == '__main__':
    app.run(port=8080, host='127.0.0.1')