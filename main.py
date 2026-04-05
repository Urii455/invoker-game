from flask import Flask, url_for, render_template
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('base.html')


list1 = ['Cold Snap', 'Ghost Walk', 'Ice Wall', 'EMP', 'Tornado', 
         'Alacrity', 'Sun Strike', 'Forge Spirit', 'Chaos Meteor', 'Deafening Blast']
shuffled = list1[:]
random.shuffle(shuffled)


if __name__ == '__main__':
    app.run(port=8080, host='127.0.0.1')    