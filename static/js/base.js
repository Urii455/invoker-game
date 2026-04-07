function showToast(msg, duration = 5000) {
  document.getElementById('toast-body').textContent = msg;
  const el = document.getElementById('app-toast');
  const t = bootstrap.Toast.getOrCreateInstance(el, { delay: duration, autohide: true });
  t.show();
}

const sk1 = 'Cold Snap - Q Q Q'
const sk2 = 'Ghost Walk - Q Q W'
const sk3 = 'Ice Wall - Q Q E'
const sk4 = 'EMP - W W W'
const sk5 = 'Tornado - W W Q'
const sk6 = 'Alacrity - W W E'
const sk7 = 'Sun Strike - E E E'
const sk8 = 'Forge Spirit - E E Q'
const sk9 = 'Chaos Meteor - E E W'
const sk10 = 'Deafening Blast - Q W E'

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
let lastTime = null; // Переменная для хранения последнего времени

// Функция для сохранения только последнего времени
function saveLastTimeToJSON(timeInSeconds) {
    lastTime = parseFloat(timeInSeconds.toFixed(3));

    // Создаем JSON с последним временем
    const jsonStr = JSON.stringify({ lastTime: lastTime }, null, 2);

    // Создаем Blob и скачиваем файл
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'last_time.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Последнее время сохранено: ${lastTime}с`);
    showToast(`Время ${lastTime}с сохранено`, 2000);
}

function resetPage() {
    abilities = shuffleArray([...originalAbilities]);
    currentIndex = 0;
    lastTime = null;

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
    if (resultDiv) resultDiv.textContent = '';
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
        if (resultDiv) resultDiv.textContent = `Нажатые клавиши: ${keysPressed.join(' → ')}`;
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
                    })
                    .catch(error => console.error('Ошибка получения времени:', error));
            }, 50);
        }

        messageBox.innerHTML = abilities[currentIndex];
        number.innerHTML = currentIndex + 1;

        // Сохраняем только последнее время (перезаписываем при каждом нажатии)
        if (currentIndex === abilities.length - 1) {
            // Сохраняем время только для последней способности
            fetch('/get-time')
                .then(response => response.json())
                .then(data => {
                    saveLastTimeToJSON(data.time);
                })
                .catch(error => console.error('Ошибка получения времени:', error));
        }

        currentIndex++;

        if (currentIndex === abilities.length) {
            fetch('/stop-timer');
            clearInterval(timerInterval);
            timerInterval = null;
            console.log('Все способности завершены!');
            showToast('Последнее время сохранено!', 3000);
        }
    } else {
        messageBox.innerHTML = "конец";
    }
}

// Инициализация переменных после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    resetListener();
    document.addEventListener('keydown', onStartKeyPress);
    document.addEventListener('keydown', onKeyPress);
});
