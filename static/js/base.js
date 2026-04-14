function showToast(msg, duration = 5000) {
  const toastEl = document.getElementById('app-toast');
  if (!toastEl) return;
  document.getElementById('toast-body').textContent = msg;
  const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: duration, autohide: true });
  t.show();
}

const originalAbilities = ['Cold Snap', 'Ghost Walk', 'Ice Wall', 'EMP', 'Tornado',
  'Alacrity', 'Sun Strike', 'Forge Spirit', 'Chaos Meteor', 'Deafening Blast'];

let abilities = [];
let currentIndex = 0;
let timerInterval = null;
let lastTime = null;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function saveLastTimeToJSON(timeInSeconds) {
    lastTime = parseFloat(timeInSeconds.toFixed(3));
    const jsonStr = JSON.stringify({ lastTime: lastTime }, null, 2);
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
    document.getElementById('result').innerHTML = '';
    document.getElementById('verdict').innerHTML = '';
    fetch('/stop-timer');
}

const resultDiv = document.getElementById('result');
const verdictDiv = document.getElementById('verdict');
let listening = false;
let keysPressed = [];
let currentAbility = '';

function resetListener() {
    keysPressed = [];
    listening = true;
    if (resultDiv) resultDiv.textContent = '';
    if (verdictDiv) verdictDiv.textContent = '';
    console.log('Слушаю 3 клавиши (R не считается)...');
}

function onKeyPress(event) {
    if (!listening) return;
    
    let keyName = event.key.toUpperCase();
    
    if (keyName === 'R') {
        console.log('Клавиша R нажата, но игнорируется (не считается)');
        return;
    }
    
    if (keyName !== 'Q' && keyName !== 'W' && keyName !== 'E') {
        console.log(`Клавиша ${keyName} игнорируется (разрешены только Q, W, E)`);
        return;
    }
    
    keysPressed.push(keyName);
    console.log(`Нажата клавиша ${keysPressed.length}: ${keyName}`);
    
    if (keysPressed.length === 3) {
        listening = false;
        resultDiv.textContent = `Нажатые клавиши: ${keysPressed.join(' → ')}`;
        checkCombination();
    }
}

async function checkCombination() {
    try {
        const response = await fetch('/check-combination', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ability: currentAbility,
                combination: keysPressed
            })
        });
        
        const data = await response.json();
        
        if (data.correct) {
            verdictDiv.innerHTML = '✅ ПРАВИЛЬНО! ✅';
            verdictDiv.style.color = '#00ff00';
            verdictDiv.style.fontWeight = 'bold';
            showToast(`Правильно! ${currentAbility} = ${data.expected}`, 2000);
            console.log('Правильная комбинация!');
        } else {
            verdictDiv.innerHTML = `❌ НЕПРАВИЛЬНО! ❌<br>Ожидалось: ${data.expected}<br>Получено: ${data.got}`;
            verdictDiv.style.color = '#ff4444';
            verdictDiv.style.fontWeight = 'bold';
            showToast(`Неправильно! ${currentAbility} требует ${data.expected}`, 3000);
            console.log('Неправильная комбинация!');
        }
    } catch (error) {
        console.error('Ошибка проверки комбинации:', error);
        verdictDiv.innerHTML = '❌ Ошибка проверки ❌';
        verdictDiv.style.color = '#ff4444';
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
        currentAbility = abilities[currentIndex];
        
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

        messageBox.innerHTML = currentAbility;
        number.innerHTML = currentIndex + 1;

        if (currentIndex === abilities.length - 1) {
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
        resetListener();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    abilities = shuffleArray([...originalAbilities]);
    resetListener();
    document.addEventListener('keydown', onStartKeyPress);
    document.addEventListener('keydown', onKeyPress);
});

function updateTime() {
  const now = new Date();
  const options = { 
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  };
  const datetimeEl = document.getElementById('datetime');
  if (datetimeEl) {
    datetimeEl.innerHTML = now.toLocaleDateString('ru-RU', options);
  }
}
updateTime();
setInterval(updateTime, 1000);

console.log('Используйте R для старта');
console.log('Нажимайте Q, W, E в правильном порядке для каждого скилла');