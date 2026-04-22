from flask import Flask, jsonify, render_template, session, request
import random
import time
import json
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = 'invoker_secret_key_12345'

start_time = None
timer_running = False

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

def load_previous_time():
    try:
        if os.path.exists('last_time.json'):
            with open('last_time.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('lastTime')
    except Exception as e:
        print(f"Ошибка загрузки previous_time: {e}")
    return None

def save_time_with_comparison(current_time):
    previous_time = load_previous_time()
    
    save_data = {
        'lastTime': float(current_time),
        'timestamp': time.time(),
        'date': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    with open('last_time.json', 'w', encoding='utf-8') as f:
        json.dump(save_data, f, indent=2, ensure_ascii=False)
    
    comparison = None
    if previous_time is not None:
        difference = previous_time - current_time
        if difference > 0:
            comparison = {
                'improved': True,
                'difference': round(difference, 3),
                'message': f'🎉 Улучшение! Новый рекорд! Быстрее на {difference:.3f} секунд! 🎉'
            }
        elif difference < 0:
            comparison = {
                'improved': False,
                'difference': round(abs(difference), 3),
                'message': f'😔 Результат хуже на {abs(difference):.3f} секунд. Попробуй еще раз!'
            }
        else:
            comparison = {
                'improved': False,
                'difference': 0,
                'message': f'🤔 Результат такой же, как и в прошлый раз.'
            }
    else:
        comparison = {
            'improved': True,
            'difference': current_time,
            'message': f'🌟 Это твой первый результат! Время: {current_time:.3f} секунд. 🌟'
        }
    
    return comparison

@app.route('/')
def index():
    shuffled = abilities[:]
    random.shuffle(shuffled)
    previous_time = load_previous_time()
    return render_template('base.html', abilities=shuffled, previous_time=previous_time)

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

@app.route('/save-time', methods=['POST'])
def save_time():
    try:
        data = request.json
        time_value = data.get('time')
        
        if time_value is None:
            return jsonify({'error': 'No time provided'}), 400
        
        comparison = save_time_with_comparison(float(time_value))
        
        return jsonify({
            'status': 'success', 
            'comparison': comparison
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/check-combination', methods=['POST'])
def check_combination():
    data = request.json
    ability = data.get('ability')
    combination = data.get('combination')
    
    if ability in ability_combinations:
        expected = ability_combinations[ability]
        is_correct = expected == combination
        return jsonify({
            'correct': is_correct,
            'expected': ' → '.join(expected),
            'got': ' → '.join(combination)
        })
    return jsonify({'correct': False, 'error': 'Ability not found'})

if __name__ == '__main__':
    app.run(port=8080, host='127.0.0.1', debug=True) 