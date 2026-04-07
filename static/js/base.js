function showToast(msg, duration = 5000) {
  document.getElementById('toast-body').textContent = msg;
  const el = document.getElementById('app-toast');
  const t = bootstrap.Toast.getOrCreateInstance(el, { delay: duration, autohide: true });
  t.show();
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const originalAbilities = ['Cold Snap', 'Ghost Walk', 'Ice Wall', 'EMP', 'Tornado',
  'Alacrity', 'Sun Strike', 'Forge Spirit', 'Chaos Meteor', 'Deafening Blast'];

let abilities = shuffleArray([...originalAbilities]);
let currentIndex = 0;
let timerInterval = null;

function resetPage() {
    abilities = shuffleArray([...originalAbilities]);
    currentIndex = 0;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.getElementById('messageBox').innerHTML = '';
    document.getElementById('number').innerHTML = '';
    document.getElementById('timer').innerHTML = 'Время: 0.000 секунд';
    fetch('/stop-timer');
}

const resultDiv = document.getElementById('result');
let listening = false;
let keysPressed = [];

function resetListener() {
    keysPressed = [];
    listening = true;
    resultDiv.textContent = '';
    console.log('Слушаю 3 клавиши (R не считается)...');
}

function onKeyPress(event) {
    if (!listening) return;

    let keyName = event.key;
    if (keyName === 'r' || keyName === 'R') {
        console.log('Клавиша R нажата, но игнорируется (не считается)');
        return;
    }

    keysPressed.push(keyName);
    console.log(`Нажата клавиша ${keysPressed.length}: ${keyName}`);

    if (keysPressed.length === 3) {
        listening = false;
        resultDiv.textContent = `Нажатые клавиши: ${keysPressed.join(' → ')}`;
        console.log('Готово!', keysPressed);
    }
}

function onStartKeyPress(event) {
    if (event.key === 'r' || event.key === 'R') {
        console.log('Нажата R - запускаю showNextAbility (R не считается)');
        showNextAbility();
    }
}

function showNextAbility() {
    let messageBox = document.getElementById('messageBox');
    let number = document.getElementById('number');

    if (!listening) {
        resetListener();
    }

    if (currentIndex < abilities.length) {
        if (currentIndex === 0) {
            fetch('/start-timer');
            timerInterval = setInterval(function() {
                fetch('/get-time')
                    .then(response => response.json())
                    .then(data => {
                        let seconds = data.time.toFixed(3);
                        document.getElementById('timer').innerHTML = 'Время: ' + seconds + ' секунд';
                    });
            }, 50);
        }

        messageBox.innerHTML = abilities[currentIndex];
        number.innerHTML = currentIndex + 1;
        currentIndex++;

        if (currentIndex === abilities.length) {
            fetch('/stop-timer');
            clearInterval(timerInterval);
        }
    } else {
        messageBox.innerHTML = "конец";
    }
}

document.addEventListener('keydown', onStartKeyPress);
document.addEventListener('keydown', onKeyPress);
